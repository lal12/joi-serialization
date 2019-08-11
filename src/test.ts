import {expect} from "chai";
import * as JOI from "joi";
import {serialize, deserialize} from "./index";

function checkSchema(sch: JOI.Schema){
	const ser = serialize(sch);
	const deserSch = deserialize(ser);
	const origDesc = sch.describe();
	const deserDesc = deserSch.describe();
	expect(deserDesc).to.deep.equal(origDesc);
}

function runSchemaCheck(msg: string, sch: JOI.Schema){
	it(msg, ()=>{
		checkSchema(sch);
	})
}

function runSingleFuncCheck(sch: JOI.Schema, funcname: string, ...args: any[]){
	let argName = "";
	try{
		argName += JSON.stringify(args);
	}catch(e){}
	runSchemaCheck(funcname+" "+argName, (sch as any)[funcname](...args));
}

describe('any', ()=>{
	runSchemaCheck('simple any', JOI.any());
	runSingleFuncCheck(JOI.any(), 'allow', 1234);
	runSingleFuncCheck(JOI.any(), 'allow', 1234, 12345);
	runSingleFuncCheck(JOI.any(), 'allow', [1234, 12345]);
	runSingleFuncCheck(JOI.any(), 'valid', 1234);
	runSingleFuncCheck(JOI.any(), 'valid', 1234, 12345);
	runSingleFuncCheck(JOI.any(), 'valid', [1234, 12345]);
	runSingleFuncCheck(JOI.any(), 'invalid', 1234);
	runSingleFuncCheck(JOI.any(), 'invalid', 1234, 12345);
	runSingleFuncCheck(JOI.any(), 'invalid', [1234, 12345]);
	runSingleFuncCheck(JOI.any(), 'required');
	runSingleFuncCheck(JOI.any(), 'optional');
	runSingleFuncCheck(JOI.any(), 'forbidden');
	runSingleFuncCheck(JOI.any(), 'strip');
	
	runSingleFuncCheck(JOI.any(), 'unit', 'seconds');
	runSingleFuncCheck(JOI.any(), 'options', {convert: false});
	runSingleFuncCheck(JOI.any(), 'strict', true);
	runSingleFuncCheck(JOI.any(), 'strict', false);
	runSingleFuncCheck(JOI.any(), 'default', ['val', 'desc']);
	runSingleFuncCheck(JOI.any(), 'raw', true);
	runSingleFuncCheck(JOI.any(), 'raw', false);
	runSingleFuncCheck(JOI.any(), 'empty', '');
})

describe('string', ()=>{
	runSchemaCheck('simple string', JOI.string());
	runSingleFuncCheck(JOI.string(), 'regex', /1234/, {name:"hi", invert: true});
	runSingleFuncCheck(JOI.string(), 'min', 123, 'utf8');
	runSingleFuncCheck(JOI.string(), 'max', 123, 'utf8');
	runSingleFuncCheck(JOI.string(), 'token');
	runSingleFuncCheck(JOI.string(), 'alphanum');
	runSingleFuncCheck(JOI.string(), 'base64', {paddingRequired: true});
	runSingleFuncCheck(JOI.string(), 'creditCard');
	runSingleFuncCheck(JOI.string(), 'dataUri', {paddingRequired: true});
	runSingleFuncCheck(JOI.string(), 'email', {errorLevel: 2, tldWhitelist: ['de'], minDomainAtoms: 3});
	runSingleFuncCheck(JOI.string(), 'guid');
	runSingleFuncCheck(JOI.string(), 'hex', {byteAligned: true});
	runSingleFuncCheck(JOI.string(), 'hostname');
	runSingleFuncCheck(JOI.string(), 'ip', {version: ['ipv4'], cidr: 'optional'});
	runSingleFuncCheck(JOI.string(), 'isoDate');
	runSingleFuncCheck(JOI.string(), 'length', 99, 'utf8');
	runSingleFuncCheck(JOI.string(), 'uuid');
	runSingleFuncCheck(JOI.string(), 'uri', {scheme: 'http', allowRelative: false, relativeOnly: false, allowQuerySquareBrackets: false});
	
	describe('converters', ()=>{
		runSingleFuncCheck(JOI.string(), 'lowercase');
		runSingleFuncCheck(JOI.string(), 'uppercase');
		runSingleFuncCheck(JOI.string(), 'insensitive');
		runSingleFuncCheck(JOI.string(), 'truncate', true);
		runSingleFuncCheck(JOI.string(), 'truncate', false);
		runSingleFuncCheck(JOI.string(), 'trim', true); 
		runSingleFuncCheck(JOI.string(), 'trim', false);
		runSingleFuncCheck(JOI.string(), 'replace', /123/, "1234");
		runSingleFuncCheck(JOI.string(), 'normalize', 'NFD');
	})
})

describe('boolean', ()=>{
	runSchemaCheck('simple bool', JOI.bool());
	runSingleFuncCheck(JOI.bool(), 'truthy', 1234);
	runSingleFuncCheck(JOI.bool(), 'falsy', 1234);
	runSingleFuncCheck(JOI.bool(), 'insensitive', true);
	runSingleFuncCheck(JOI.bool(), 'insensitive', false);
})

describe('func', ()=>{
	runSchemaCheck('simple func', JOI.func());
	runSingleFuncCheck(JOI.func(), 'arity', 2);
	runSingleFuncCheck(JOI.func(), 'minArity', 1);
	runSingleFuncCheck(JOI.func(), 'maxArity', 3);
	runSingleFuncCheck(JOI.func(), 'class');
});

describe('number', ()=>{
	runSchemaCheck('simple number', JOI.number());
	runSingleFuncCheck(JOI.number(), 'unsafe', true);
	runSingleFuncCheck(JOI.number(), 'unsafe', false);
	runSingleFuncCheck(JOI.number(), 'min', 1);
	runSingleFuncCheck(JOI.number(), 'max', 3);
	runSingleFuncCheck(JOI.number(), 'greater', 1);
	runSingleFuncCheck(JOI.number(), 'less', 4);
	runSingleFuncCheck(JOI.number(), 'integer');
	runSingleFuncCheck(JOI.number(), 'precision', 2);
	runSingleFuncCheck(JOI.number(), 'multiple', 3);
	runSingleFuncCheck(JOI.number(), 'positive');
	runSingleFuncCheck(JOI.number(), 'negative');
	runSingleFuncCheck(JOI.number(), 'port');
});

describe('object', ()=>{
	runSchemaCheck('simple object', JOI.object());
	runSingleFuncCheck(JOI.object(), 'keys', {a: JOI.number()});
	runSingleFuncCheck(JOI.object(), 'append', {a: JOI.number()});
	runSingleFuncCheck(JOI.object(), 'min', 1);
	runSingleFuncCheck(JOI.object(), 'max', 5);
	runSingleFuncCheck(JOI.object(), 'length', 3);
	runSingleFuncCheck(JOI.object(), 'pattern', /asd/i, JOI.bool());
	runSingleFuncCheck(JOI.object(), 'and', 'a', 'b');
	runSingleFuncCheck(JOI.object(), 'nand', 'a', 'b');
	runSingleFuncCheck(JOI.object(), 'or', 'a', 'b');
	runSingleFuncCheck(JOI.object(), 'xor', 'a', 'b');
	runSingleFuncCheck(JOI.object(), 'oxor', 'a', 'b');
	runSingleFuncCheck(JOI.object(), 'with', 'a', 'b');
	runSingleFuncCheck(JOI.object(), 'with', 'a', ['b']);
	runSingleFuncCheck(JOI.object(), 'without', 'a', 'b');
	runSingleFuncCheck(JOI.object(), 'without', 'a', ['b']);
	runSingleFuncCheck(JOI.object(), 'rename', 'a', 'b');
	runSingleFuncCheck(JOI.object(), 'rename', /a/, 'b');
	runSingleFuncCheck(JOI.object(), 'rename', 'a', 'b', {
		alias: true, multiple: true, override: true, ignoreUndefined: true
	});
	runSingleFuncCheck(JOI.object(), 'assert', 'a.b', JOI.number());
	runSingleFuncCheck(JOI.object(), 'assert', JOI.ref('f.v'), JOI.number());
	runSingleFuncCheck(JOI.object(), 'assert', 'a.b', JOI.number(), 'asd');
	runSingleFuncCheck(JOI.object(), 'unknown', false);
	runSingleFuncCheck(JOI.object(), 'unknown', true);
	runSingleFuncCheck(JOI.object(), 'type', RegExp);
	runSingleFuncCheck(JOI.object(), 'type', RegExp, 'bla');
	runSingleFuncCheck(JOI.object(), 'schema');
	runSingleFuncCheck(JOI.object({a: JOI.number()}), 'requiredKeys', 'a');
	runSingleFuncCheck(JOI.object({a: JOI.number()}), 'optionalKeys', 'a');
	runSingleFuncCheck(JOI.object({a: JOI.number()}), 'forbiddenKeys', 'a');
});

describe('array', ()=>{
	runSchemaCheck('simple array', JOI.array());
	runSingleFuncCheck(JOI.array(), 'sparse', true);
	runSingleFuncCheck(JOI.array(), 'sparse', false);
	runSingleFuncCheck(JOI.array(), 'single', true);
	runSingleFuncCheck(JOI.array(), 'single', false);
	runSingleFuncCheck(JOI.array(), 'items', JOI.number());
	runSingleFuncCheck(JOI.array(), 'ordered', JOI.number(), JOI.string());
	runSingleFuncCheck(JOI.array(), 'min', 0);
	runSingleFuncCheck(JOI.array(), 'max', 4);
	runSingleFuncCheck(JOI.array(), 'length', 3);
	runSingleFuncCheck(JOI.array(), 'unique', (a:any,b:any)=>a-b, {ignoreUndefined: true});
	runSingleFuncCheck(JOI.array(), 'unique', '1');
	runSingleFuncCheck(JOI.array(), 'has', JOI.number());
});

describe('symbol', ()=>{
	runSchemaCheck('simple symbol', JOI.symbol());
	runSingleFuncCheck(JOI.symbol(), 'map', [
		['one', Symbol('one')]
	]);
});

describe('binary', ()=>{
	runSchemaCheck('simple binary', JOI.binary());
	runSingleFuncCheck(JOI.binary(), 'encoding', 'base64');
	runSingleFuncCheck(JOI.binary(), 'min', 5);
	runSingleFuncCheck(JOI.binary(), 'max', 10);
	runSingleFuncCheck(JOI.binary(), 'length', 7);
});

describe('date', ()=>{
	runSchemaCheck('simple date', JOI.date());
	runSingleFuncCheck(JOI.date(), 'min', 'now');
	runSingleFuncCheck(JOI.date(), 'min', '1-1-2000');
	runSingleFuncCheck(JOI.date(), 'max', 'now');
	runSingleFuncCheck(JOI.date(), 'max', '1-1-2020');
	runSingleFuncCheck(JOI.date(), 'greater', 'now');
	runSingleFuncCheck(JOI.date(), 'greater', '1-1-2000');
	runSingleFuncCheck(JOI.date(), 'less', 'now');
	runSingleFuncCheck(JOI.date(), 'less', '1-1-2020');
	runSingleFuncCheck(JOI.date(), 'iso');
	runSingleFuncCheck(JOI.date(), 'timestamp');
	runSingleFuncCheck(JOI.date(), 'timestamp', 'javascript');
	runSingleFuncCheck(JOI.date(), 'timestamp', 'unix');
})

describe('meta', ()=>{
	runSingleFuncCheck(JOI.any(), 'meta', {my: "meta object"});
	runSingleFuncCheck(JOI.any(), 'description', "my description");
	runSingleFuncCheck(JOI.any(), 'error', new Error("my err msg"));
	runSingleFuncCheck(JOI.any(), 'example', 3, {parent: {sibling: 10}});
	runSingleFuncCheck(JOI.any(), 'example', "1234");
	runSingleFuncCheck(JOI.any(), 'example', [{value: 'example'}]);
	runSingleFuncCheck(JOI.any(), 'notes', "my notes");
	runSingleFuncCheck(JOI.any(), 'tags', ["my tag"]);
	runSingleFuncCheck(JOI.any(), 'unit', "my unit");
	runSingleFuncCheck(JOI.any(), 'label', "my label");
	runSingleFuncCheck(JOI.any(), 'notes', ['bla', 'bla2']);
})

describe('alternatives', ()=>{
	checkSchema(JOI.alternatives());
	runSchemaCheck('empty', JOI.alternatives());
	runSchemaCheck('filled', JOI.alternatives(JOI.string(), JOI.number()));
})

