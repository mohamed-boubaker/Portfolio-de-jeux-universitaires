"""Adaptateur BDW pour exécuter les vrais contrôleurs Python dans Pyodide.

Chaque application a sa base SQLite et sa session, locales à cet onglet.
Les requêtes PostgreSQL courantes sont converties à la frontière SQL.
"""
import contextlib
import io
import json
import logging
from pathlib import Path
import re
import sqlite3
import sys
import types


def sql_text(query):
    query = str(query)
    query = re.sub(r'\b(?:jeu|legos)\.', '', query)
    query = query.replace('%s', '?')
    query = re.sub(r'\bDEFAULT\b(?=\s*[,\)])', 'NULL', query, flags=re.I)
    query = re.sub(r'ORDER BY COUNT DESC', 'ORDER BY COUNT(*) DESC', query, flags=re.I)
    query = re.sub(r"TO_CHAR\((\w+),\s*'MM/YYYY'\)", r"strftime('%m/%Y', \1)", query, flags=re.I)
    query = re.sub(r'EXTRACT\(YEAR FROM (\w+)\)', r"CAST(strftime('%Y', \1) AS INTEGER)", query, flags=re.I)
    query = re.sub(r'EXTRACT\(MONTH FROM (\w+)\)', r"CAST(strftime('%m', \1) AS INTEGER)", query, flags=re.I)
    return query


class SQL(str):
    def format(self, *args, **kwargs):
        return SQL(str(self).format(*args, **kwargs))


def identifier(*names):
    return SQL('.'.join('"' + str(name).replace('"', '""') + '"' for name in names))


class Cursor:
    def __init__(self, db): self.db, self.cursor = db, db.cursor()
    def __enter__(self): return self
    def __exit__(self, *error):
        if not error[0]: self.db.commit()
        self.cursor.close()
    def execute(self, query, params=()):
        self.cursor.execute(sql_text(query), params or ())
        return self
    def fetchall(self): return self.cursor.fetchall()
    def fetchone(self): return self.cursor.fetchone()
    @property
    def rowcount(self): return self.cursor.rowcount


class Connection:
    def __init__(self):
        from datetime import datetime
        self.db = sqlite3.connect(':memory:')
        self.db.create_function('NOW', 0, lambda: datetime.now().isoformat(' '))
        self.db.create_function('strpos', 2, lambda text, needle: (text or '').find(needle) + 1)
    def cursor(self): return Cursor(self.db)
    def commit(self): self.db.commit()
    def rollback(self): self.db.rollback()


def install_modules():
    psycopg = types.ModuleType('psycopg')
    psycopg.Error = sqlite3.Error
    psycopg.sql = types.SimpleNamespace(SQL=SQL, Identifier=identifier)
    sys.modules['psycopg'] = psycopg
    logzero = types.ModuleType('logzero')
    logzero.logger = logging.getLogger('portfolio')
    sys.modules['logzero'] = logzero


def schema_for_browser(schema, app):
    schema = re.sub(r'^\s*(?:CREATE SCHEMA|DROP SCHEMA|SET search_path)[^;]*;', '', schema, flags=re.M | re.I)
    schema = re.sub(r'\s+CASCADE', '', schema, flags=re.I)
    schema = re.sub(r'\b(?:jeu|legos)\.', '', schema)
    schema = re.sub(r'\bid\s+serial\s+primary\s+key', 'id INTEGER PRIMARY KEY AUTOINCREMENT', schema, flags=re.I)
    schema = re.sub(r'numligne\s+SERIAL\s*,', 'numligne INTEGER PRIMARY KEY AUTOINCREMENT,', schema, flags=re.I)
    schema = re.sub(r'\s*PRIMARY KEY\s*\(numligne\)\s*,', '', schema, flags=re.I)
    # Le jeu de données de BrickMaster contient deux tours numérotés 1.
    if app == 'brickmaster': schema = schema.replace("VALUES(2, 1, 'défaussé', 3)", "VALUES(2, 3, 'défaussé', 3)")
    return schema


class BrowserApp:
    def __init__(self, payload, base_url):
        from jinja2 import Environment, DictLoader, select_autoescape
        install_modules()
        self.app = payload['app']
        self.root = Path('/tmp/portfolio') / self.app
        self.site = self.root / 'site'
        for name, text in payload['files'].items():
            p = self.site / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text, encoding='utf8')
        for package in ['model', 'controleurs']:
            (self.site / package / '__init__.py').touch()
        sys.path.insert(0, str(self.site))
        for name in list(sys.modules):
            if name == 'model' or name.startswith('model.') or name == 'controleurs' or name.startswith('controleurs.'):
                del sys.modules[name]
        self.connection = Connection()
        self.connection.db.executescript(schema_for_browser(payload['schema'], self.app))
        self.routes = payload['routes']
        self.base_url = base_url.rstrip('/')
        self.session = {'DIRECTORY': str(self.site), 'CONNEXION': self.connection}
        exec(compile(payload['files']['init.py'], 'init.py', 'exec'), {'SESSION': self.session})
        Path(self.session['DIR_HISTORIQUE']).mkdir(parents=True, exist_ok=True)
        self.session['DIRECTORY'] = self.base_url
        self.templates = Environment(loader=DictLoader(payload['templates']), autoescape=select_autoescape(['html']))
        if self.app == 'morpion': self.seed_morpion()
        self.connection.db.execute('PRAGMA foreign_keys=ON')

    def seed_morpion(self):
        """Le SQL du dépôt fournit les tables, sans lignes : démo explicitement ajoutée."""
        db = self.connection.db
        for i in range(1, 17):
            db.execute('INSERT INTO morpion VALUES (?,?,?,?,?,?)',
                       (f'Pingouin {i:02d}', f't{i}.png', 6 + i % 3, 2 + i % 2, 2 + i % 3, 20 + i % 4 * 5))
        for color, name, start in [('#357DB8', 'Équipe Azur', 1), ('#D17835', 'Équipe Corail', 9)]:
            db.execute("INSERT INTO equipe VALUES (?,?,CURRENT_DATE)", (color, name))
            for i in range(start, start + 8): db.execute('INSERT INTO possede VALUES (?,?)', (f'Pingouin {i:02d}', color))
        db.execute("INSERT INTO config(id_config,taille_de_grille,maxtour) VALUES ('DEMO_3X3',3,40)")
        db.commit()

    def request(self, route='', post=None):
        route = route.strip('/')
        if route not in self.routes: raise ValueError('Page inconnue')
        spec = self.routes[route]
        request_vars, post = {}, post or {}
        scope = {'SESSION': self.session, 'REQUEST_VARS': request_vars, 'POST': post, 'GET': {}}
        with contextlib.redirect_stdout(io.StringIO()):
            source = (self.site / spec['controleur']).read_text()
            exec(compile(source, spec['controleur'], 'exec'), scope)
        self.connection.commit()
        # Les contrôleurs demandent une nouvelle requête après une action.
        if request_vars.get('partie_creee_id'): return self.request('plateau')
        if request_vars.get('refresh'): return self.request('plateau')
        html = self.templates.get_template(spec['template'].removeprefix('templates/')).render(
            SESSION=self.session, REQUEST_VARS=request_vars, POST=post, GET={}, range=range)
        html = html.replace('<base href="/">', f'<base href="{self.base_url}/">')
        html = html.replace('/serial_critique/static/', f'{self.base_url}/static/')
        html = html.replace('serial_critique/static/', f'{self.base_url}/static/')
        html = html.replace('href="/"', f'href="{self.base_url}/"')
        downloads = {}
        if request_vars.get('fichier_genere'):
            name = request_vars['fichier_genere']
            downloads[name] = (Path(self.session['DIR_HISTORIQUE']) / name).read_text()
        # Ce correctif de présentation conserve les templates et les sprites du projet.
        html = html.replace('</head>', '<meta name="viewport" content="width=device-width,initial-scale=1"><style>'
            'html,body{min-width:0!important}body{margin:0}img{max-width:100%}main{min-width:0}'
            'form{max-width:100%}input,select,button{font:inherit}table{max-width:100%}'
            'header{padding:12px!important;font-size:14px!important;letter-spacing:1px!important}header h1{font-size:25px;margin:8px 0}header img{width:44px!important;height:44px!important;object-fit:contain}'
            'nav{flex:0 0 145px!important;box-sizing:border-box}main{padding:18px!important}nav ul{padding:0;list-style:none}.plateau-grille{grid-template-columns:repeat(var(--taille-grille),min(105px,19vw))!important}.plateau-grille .case{width:min(105px,19vw);height:min(105px,19vw)}.morpion-list{gap:8px}.morpion-card img{width:40px;height:40px}.match-header{font-size:1.2em;gap:20px}.selection-box-tour{padding:10px;margin-bottom:10px}'
            '@media(max-width:650px){#div-central{display:block!important}nav{width:auto!important;display:flex;flex-wrap:wrap;gap:12px}nav br{display:none}header{min-height:80px}main{padding:15px!important}}'
            '</style></head>')
        return {'html': html, 'route': route, 'downloads': downloads}


APP = None


def boot(payload_json, base_url):
    global APP
    APP = BrowserApp(json.loads(payload_json), base_url)
    return json.dumps(APP.request(), ensure_ascii=False)


def navigate(route, post_json='{}'):
    return json.dumps(APP.request(route, json.loads(post_json)), ensure_ascii=False)
