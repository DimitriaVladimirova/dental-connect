/**
 * Dentist Connect Mock Server (SoftUni practice server adapted)
 * Start:  node server.js
 * Admin:  http://localhost:3030/admin
 *
 * Auth Header:  x-authorization: <accessToken>
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? module.exports = factory(require('http'), require('fs'), require('crypto'))
        : typeof define === 'function' && define.amd
            ? define(['http', 'fs', 'crypto'], factory)
            : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, function (http, fs, crypto) {
    'use strict';

    function _interopDefaultLegacy(e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }
    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    // ---------- Error Classes ----------
    class ServiceError extends Error { constructor(message = 'Service Error') { super(message); this.name = 'ServiceError'; } }
    class NotFoundError extends ServiceError { constructor(message = 'Resource not found') { super(message); this.name = 'NotFoundError'; this.status = 404; } }
    class RequestError extends ServiceError { constructor(message = 'Request error') { super(message); this.name = 'RequestError'; this.status = 400; } }
    class ConflictError extends ServiceError { constructor(message = 'Resource conflict') { super(message); this.name = 'ConflictError'; this.status = 409; } }
    class AuthorizationError extends ServiceError { constructor(message = 'Unauthorized') { super(message); this.name = 'AuthorizationError'; this.status = 401; } }
    class CredentialError extends ServiceError { constructor(message = 'Forbidden') { super(message); this.name = 'CredentialError'; this.status = 403; } }

    const errors = { ServiceError, NotFoundError, RequestError, ConflictError, AuthorizationError, CredentialError };
    const { ServiceError: ServiceError$1 } = errors;

    // ---------- Request Handler Core ----------
    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, { 'Location': `http://${req.headers.host}/admin/` });
                return res.end();
            }

            let status = 200;
            let headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
            let result = '';
            let context;

            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];
                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }

    function composeErrorObject(code, message) { return JSON.stringify({ code, message }); }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v) }), {});
        const body = await parseBody(req);
        return { serviceName, tokens, query, body };
    }

    function parseBody(req) {
        return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try { resolve(JSON.parse(body)); } catch { resolve(body); }
            });
        });
    }

    // ---------- Service Helper ----------
    class Service {
        constructor() { this._actions = []; this.parseRequest = this.parseRequest.bind(this); }
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }
        registerAction(method, name, handler) { this._actions.push({ method, name, handler }); }
        get(name, handler) { this.registerAction('GET', name, handler); }
        post(name, handler) { this.registerAction('POST', name, handler); }
        put(name, handler) { this.registerAction('PUT', name, handler); }
        patch(name, handler) { this.registerAction('PATCH', name, handler); }
        delete(name, handler) { this.registerAction('DELETE', name, handler); }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') return true;
        else if (pattern?.[0] == ':') { context.params[pattern.slice(1)] = name; return true; }
        else if (name == pattern) return true;
        else return false;
    }

    // ---------- Util ----------
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    const util = { uuid };
    const uuid$1 = util.uuid;

    // ---------- Raw JSON Data Loader (legacy) ----------
    const data = fs__default['default'].existsSync('./data')
        ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
            const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
            const collection = c.slice(0, -5);
            p[collection] = {};
            for (let endpoint in content) { p[collection][endpoint] = content[endpoint]; }
            return p;
        }, {}) : {};

    // ---------- Generic JSON Service (unchanged) ----------
    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) if (responseData !== undefined) responseData = responseData[token];
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) responseData[token] = {};
                responseData = responseData[token];
            }
            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens.slice(0, -1)) if (responseData !== undefined) responseData = responseData[token];
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) if (responseData !== undefined) responseData = responseData[token];
            if (responseData !== undefined) Object.assign(responseData, body);
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) return null;
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };
    const dataService = new Service();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);
    const jsonstore = dataService.parseRequest;

    // ---------- Users Service ----------
    const { AuthorizationError: AuthorizationError$1 } = errors;
    const userService = new Service();
    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);
    function getSelf(context) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }
    function onRegister(context, tokens, query, body) { return context.auth.register(body); }
    function onLogin(context, tokens, query, body) { return context.auth.login(body); }
    function onLogout(context) { return context.auth.logout(); }
    const users = userService.parseRequest;

    // ---------- CRUD (collection-level) ----------
    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;
    const crud = { get, post, put, patch, delete: del };

    function validateRequest(context, tokens) {
        if (tokens.length > 1) throw new RequestError$1();
    }
    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');
        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);
            return (record) => clauses.map(c => c(record)).reduce(check, acc);
        } catch {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }
        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];
            return operators[operator.toLowerCase()](prop, value);
        }
    }

    function get(context, tokens, query) {
        validateRequest(context, tokens);
        let responseData;
        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                return context.storage.get();
            }
            if (query.sortBy) {
                const props = query.sortBy.split(',').filter(p => p).map(p => p.split(' ').filter(p => p)).map(([p, desc]) => ({ prop: p, desc: !!desc }));
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: a }, { [prop]: b }) => {
                        if (typeof a == 'number' && typeof b == 'number') return (a - b) * (desc ? -1 : 1);
                        return a.localeCompare(b) * (desc ? -1 : 1);
                    });
                }
            }
            if (query.offset) responseData = responseData.slice(Number(query.offset) || 0);
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) responseData = responseData.slice(0, pageSize);
            if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p);
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (!distinct.hasOwnProperty(key)) distinct[key] = c;
                    return distinct;
                }, {}));
            }
            if (query.count) return responseData.length;
            if (query.select) {
                const props = query.select.split(',').filter(p => p);
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);
                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }
            if (query.load) {
                const props = query.load.split(',').filter(p => p);
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);
                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        if (related?.hashedPassword) delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }
        } catch (err) {
            if (err.message.includes('does not exist')) throw new NotFoundError$1();
            else throw new RequestError$1(err.message);
        }
        context.canAccess(responseData);
        return responseData;
    }

    function post(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length > 0) throw new RequestError$1('Use PUT to update records');
        context.canAccess(undefined, body);
        body._ownerId = context.user._id;
        let responseData;
        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch {
            throw new RequestError$1();
        }
        return responseData;
    }

    function put(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) throw new RequestError$1('Missing entry ID');
        let existing;
        try { existing = context.storage.get(context.params.collection, tokens[0]); }
        catch { throw new NotFoundError$1(); }
        context.canAccess(existing, body);
        let responseData;
        try { responseData = context.storage.set(context.params.collection, tokens[0], body); }
        catch { throw new RequestError$1(); }
        return responseData;
    }

    function patch(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) throw new RequestError$1('Missing entry ID');
        let existing;
        try { existing = context.storage.get(context.params.collection, tokens[0]); }
        catch { throw new NotFoundError$1(); }
        context.canAccess(existing, body);
        let responseData;
        try { responseData = context.storage.merge(context.params.collection, tokens[0], body); }
        catch { throw new RequestError$1(); }
        return responseData;
    }

    function del(context, tokens) {
        validateRequest(context, tokens);
        if (tokens.length != 1) throw new RequestError$1('Missing entry ID');
        let existing;
        try { existing = context.storage.get(context.params.collection, tokens[0]); }
        catch { throw new NotFoundError$1(); }
        context.canAccess(existing);
        let responseData;
        try { responseData = context.storage.delete(context.params.collection, tokens[0]); }
        catch { throw new RequestError$1(); }
        return responseData;
    }

    const dataService$1 = new Service();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);
    const data$1 = dataService$1.parseRequest;

    // ---------- Favicon & Admin ----------
    const img = Buffer.from('', 'base64'); // (Icon removed for brevity)
    const favicon = (method, tokens, query, body) => ({ headers: { 'Content-Type': 'image/png', 'Content-Length': img.length }, result: img });

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';
    const adminIndex = mode == 'prod'
        ? "<!DOCTYPE html><html><body><h2>Dentist Connect Admin</h2><p>Use original admin implementation if needed.</p></body></html>"
        : fs__default['default'].readFileSync('./client/index.html', 'utf-8');
    const files = { index: adminIndex };
    const admin = (method, tokens) => {
        const headers = { 'Content-Type': 'text/html' };
        const resource = tokens.join('/');
        let result;
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';
            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }
        return { headers, result };
    };

    // ---------- Util Service ----------
    const utilService = new Service();
    utilService.post('*', onUtilChange);
    utilService.get(':service', getUtilStatus);
    function getUtilStatus(context) { return context.util[context.params.service]; }
    function onUtilChange(context, tokens, query, body) {
        Object.entries(body).forEach(([k, v]) => { context.util[k] = v; });
        return '';
    }
    const util$1 = utilService.parseRequest;

    // ---------- Plugins: storage, auth, util, rules ----------
    const { uuid: uuid$2 } = util;
    function initStorage(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);
        return function decorateContext(context) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }

    function createInstance(seedData = {}) {
        const collections = new Map();
        for (let collectionName in seedData) {
            const collection = new Map();
            for (let recordId in seedData[collectionName]) {
                collection.set(recordId, seedData[collectionName][recordId]);
            }
            collections.set(collectionName, collection);
        }
        function get(collection, id) {
            if (!collection) return [...collections.keys()];
            if (!collections.has(collection)) throw new ReferenceError('Collection does not exist: ' + collection);
            const target = collections.get(collection);
            if (!id) return [...target.entries()].map(([k, v]) => Object.assign(deepCopy(v), { _id: k }));
            if (!target.has(id)) throw new ReferenceError('Entry does not exist: ' + id);
            return Object.assign(deepCopy(target.get(id)), { _id: id });
        }
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);
            let target = collections.get(collection);
            if (!target) { target = new Map(); collections.set(collection, target); }
            let id = uuid$2();
            while (target.has(id)) id = uuid$2();
            record._createdOn = Date.now();
            target.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }
        function set(collection, id, data) {
            if (!collections.has(collection)) throw new ReferenceError('Collection does not exist: ' + collection);
            const target = collections.get(collection);
            if (!target.has(id)) throw new ReferenceError('Entry does not exist: ' + id);
            const existing = target.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            target.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }
        function merge(collection, id, data) {
            if (!collections.has(collection)) throw new ReferenceError('Collection does not exist: ' + collection);
            const target = collections.get(collection);
            if (!target.has(id)) throw new ReferenceError('Entry does not exist: ' + id);
            const existing = deepCopy(target.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            target.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }
        function del(collection, id) {
            if (!collections.has(collection)) throw new ReferenceError('Collection does not exist: ' + collection);
            const target = collections.get(collection);
            if (!target.has(id)) throw new ReferenceError('Entry does not exist: ' + id);
            target.delete(id);
            return { _deletedOn: Date.now() };
        }
        function query(collection, queryObj) {
            if (!collections.has(collection)) throw new ReferenceError('Collection does not exist: ' + collection);
            const target = collections.get(collection);
            const result = [];
            for (let [key, entry] of [...target.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (queryObj.hasOwnProperty(prop)) {
                        const targetValue = queryObj[prop];
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false; break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false; break;
                        }
                    }
                }
                if (match) result.push(Object.assign(deepCopy(entry), { _id: key }));
            }
            return result;
        }
        return { get, add, set, merge, delete: del, query };
    }
    function assignSystemProps(target, entry, ...rest) {
        const whitelist = ['_id', '_createdOn', '_updatedOn', '_ownerId'];
        whitelist.forEach(prop => { if (entry.hasOwnProperty(prop)) target[prop] = deepCopy(entry[prop]); });
        if (rest.length > 0) Object.assign(target, ...rest);
        return target;
    }
    function assignClean(target, entry, ...rest) {
        const blacklist = ['_id', '_createdOn', '_updatedOn', '_ownerId'];
        for (let key in entry) if (!blacklist.includes(key)) target[key] = deepCopy(entry[key]);
        if (rest.length > 0) Object.assign(target, ...rest);
        return target;
    }
    function deepCopy(value) {
        if (Array.isArray(value)) return value.map(deepCopy);
        else if (typeof value == 'object' && value !== null) return Object.entries(value).reduce((p, [k, v]) => (p[k] = deepCopy(v), p), {});
        return value;
    }

    // ---------- Auth Plugin ----------
    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;
    function initAuth(settings) {
        const identity = settings.identity;
        return function decorateContext(context, request) {
            context.auth = { register, login, logout };
            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) user = userData;
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }
            function register(body) {
                if (!body[identity] || !body.password) throw new RequestError$2('Missing fields');
                if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                }
                const newUser = Object.assign({}, body, {
                    [identity]: body[identity],
                    hashedPassword: hash(body.password)
                });
                const result = context.protectedStorage.add('users', newUser);
                delete result.hashedPassword;
                const session = saveSession(result._id);
                result.accessToken = session.accessToken;
                return result;
            }
            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1 && hash(body.password) === targetUser[0].hashedPassword) {
                    const result = targetUser[0];
                    delete result.hashedPassword;
                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;
                    return result;
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }
            function logout() {
                if (context.user) {
                    const session = findSessionByUserId(context.user._id);
                    if (session) context.protectedStorage.delete('sessions', session._id);
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }
            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }
            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }
            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }

    const secret = 'This is not a production server';
    function hash(string) { const h = crypto__default['default'].createHmac('sha256', secret); h.update(string); return h.digest('hex'); }

    // ---------- Util Plugin ----------
    function initUtil() {
        const utilObj = { throttle: false };
        return function decorateContext(context) { context.util = utilObj; };
    }

    // ---------- Rules Plugin ----------
    const { CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;
    function initRules(settings) {
        const actions = { 'GET': '.read', 'POST': '.create', 'PUT': '.update', 'PATCH': '.update', 'DELETE': '.delete' };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);
        return function decorateContext(context, request) {
            const get = (collectionName, id) => context.storage.get(collectionName, id);
            const isOwner = (user, object) => user._id == object._ownerId;
            context.rules = { get, isOwner };
            const isAdmin = request.headers.hasOwnProperty('x-admin');
            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);
                if (Array.isArray(rule)) rule = checkRoles(rule, data);
                else if (typeof rule == 'string') rule = !!(eval(rule));
                if (!rule && !isAdmin) throw new CredentialError$2();
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }
            function applyPropRule(action, [prop, rule], user, data, newData) {
                if (typeof rule == 'string') rule = !!eval(rule);
                if (rule == false) {
                    if (action == '.create' || action == '.update') delete newData[prop];
                    else if (action == '.read') delete data[prop];
                }
            }
            function checkRoles(roles, data) {
                if (roles.includes('Guest')) return true;
                else if (!context.user && !isAdmin) throw new AuthorizationError$2();
                else if (roles.includes('User')) return true;
                else if (context.user && roles.includes('Owner')) return context.user._id == data._ownerId;
                else return false;
            }
            function getRule(action, collection, data = {}) {
                let currentRule = ruleOrDefault(true, rules['*'][action]);
                let propRules = [];
                const collectionRules = rules[collection];
                if (collectionRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, collectionRules[action]);
                    const allPropRules = collectionRules['*'];
                    if (allPropRules !== undefined) propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                    const recordRules = collectionRules[data._id];
                    if (recordRules !== undefined) {
                        currentRule = ruleOrDefault(currentRule, recordRules[action]);
                        propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                    }
                }
                return { rule: currentRule, propRules };
            }
            function ruleOrDefault(current, rule) {
                return (rule === undefined || rule.length === 0) ? current : rule;
            }
            function getPropRule(record, action) {
                return Object
                    .entries(record)
                    .filter(([k]) => k[0] != '.')
                    .filter(([k, v]) => v.hasOwnProperty(action))
                    .map(([k, v]) => [k, v[action]]);
            }
        };
    }

    // ---------- CUSTOMIZED SETTINGS FOR DENTIST CONNECT ----------
    const identity = "email";

    // Protected user store with two seeded users (password is '123456' hashed the same as original)
    const protectedData = {
        users: {
            "d-user-1": {
                email: "dentist@example.com",
                hashedPassword: hash("123456")
            },
            "p-user-1": {
                email: "patient@example.com",
                hashedPassword: hash("123456")
            }
        },
        sessions: {}
    };

    // Public seed data
    const seedData = {
        dentists: {
            "dent-prof-1": {
                _ownerId: "d-user-1",
                fullName: "Dr. Maria Stoyanova",
                university: "Medical University Sofia",
                workplace: "SmileCare Clinic",
                specialization: "Orthodontics",
                imageUrl: "https://placehold.co/120x120",
                details: "Experienced orthodontist focused on patient comfort and modern braces solutions.",
                phone: "+359888111222",
                _createdOn: Date.now()
            }
        },
        promotions: {
            "promo-1": {
                _ownerId: "d-user-1",
                dentistId: "dent-prof-1",
                service: "Teeth Whitening Package",
                price: 250,
                description: "Full professional whitening + consult.",
                _createdOn: Date.now()
            },
            "promo-2": {
                _ownerId: "d-user-1",
                dentistId: "dent-prof-1",
                service: "Metal Braces Discount",
                price: 1200,
                description: "10% discount on full braces treatment (initial phase).",
                _createdOn: Date.now()
            }
        },
        purchases: {
            // Empty initially
        }
    };

    /**
     * Rules explanation:
     * - Global '*' baseline: create needs User, update & delete need Owner.
     * - For dentists & promotions we keep baseline (owner edit).
     * - purchases: creation by User, but delete only Owner (patient who made purchase).
     */
    const rules$1 = {
        users: {
            ".create": false,
            ".read": ["Owner"],
            ".update": false,
            ".delete": false
        },
        dentists: {
            ".create": ["User"],
            ".read": ["Guest"],
            ".update": ["Owner"],
            ".delete": ["Owner"]
        },
        promotions: {
            ".create": ["User"],
            ".read": ["Guest"],
            ".update": ["Owner"],
            ".delete": ["Owner"]
        },
        purchases: {
            ".create": ["User"],
            ".read": ["Guest"],     // you could restrict to Owner if you want only buyer to see
            ".update": false,
            ".delete": ["Owner"]
        }
    };

    const settings = {
        identity,
        protectedData,
        seedData,
        rules: rules$1
    };

    // ---------- Assemble Plugins & Services ----------
    const plugins = [
        initStorage(settings),
        initAuth(settings),
        initUtil(),
        initRules(settings)
    ];

    const services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    // ---------- Start Server ----------
    const server = http__default['default'].createServer(createHandler(plugins, services));
    const port = 3030;
    server.listen(port);
    console.log(`Dentist Connect Mock Server running at http://localhost:${port}/`);
    console.log(`Admin panel: http://localhost:${port}/admin`);

    return {};

}));
