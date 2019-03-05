import {assert, should, expect} from "chai";
import * as JOI from "joi";

import {serialize, deserialize} from "./index";

function checkSchema(sch: JOI.Schema){
	const ser = serialize(sch);
	const deserSch = deserialize(ser);
	const origDesc = sch.describe();
	const deserDesc = deserSch.describe();
	//console.log(origDesc,deserDesc)
	expect(deserDesc).to.deep.equal(origDesc);
}

function runSchemaCheck(msg: string, sch: JOI.Schema){
	it(msg, ()=>{
		checkSchema(sch);
	})
}

function runSingleFuncCheck(sch: JOI.Schema, funcname: string, ...args: any[]){
	runSchemaCheck("check "+funcname, (sch as any)[funcname](...args));
}

describe('any', ()=>{
	runSchemaCheck('check simple any', JOI.any());
	runSingleFuncCheck(JOI.any(), 'allow', 1234);
	runSingleFuncCheck(JOI.any(), 'valid', 1234);
	runSingleFuncCheck(JOI.any(), 'invalid', 1234);
	runSingleFuncCheck(JOI.any(), 'options', {convert: false});
	runSingleFuncCheck(JOI.any(), 'strict', true);
	runSingleFuncCheck(JOI.any(), 'strict', false);
	runSingleFuncCheck(JOI.any(), 'valid', 1234);
	runSingleFuncCheck(JOI.any(), 'raw', true);
	runSingleFuncCheck(JOI.any(), 'raw', false);
	runSingleFuncCheck(JOI.any(), 'empty', '');
})

describe('string', ()=>{
	runSchemaCheck('check simple string', JOI.string());
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
	runSchemaCheck('check simple bool', JOI.bool());
	runSingleFuncCheck(JOI.bool(), 'truthy', 1234);
	runSingleFuncCheck(JOI.bool(), 'falsy', 1234);
	runSingleFuncCheck(JOI.bool(), 'insensitive', true);
	runSingleFuncCheck(JOI.bool(), 'insensitive', false);
})

describe('meta', ()=>{
	runSingleFuncCheck(JOI.any(), 'meta', {my: "meta object"});
	runSingleFuncCheck(JOI.any(), 'description', "my description");
	runSingleFuncCheck(JOI.any(), 'error', new Error("my err msg"));
	runSchemaCheck('check examples', (JOI.any() as any).example([3, {parent: {sibling: 10}}]))
	runSingleFuncCheck(JOI.any(), 'example', "1234");
	runSingleFuncCheck(JOI.any(), 'notes', "my notes");
	runSingleFuncCheck(JOI.any(), 'tags', ["my tag"]);
	runSingleFuncCheck(JOI.any(), 'unit', "my unit");
	runSingleFuncCheck(JOI.any(), 'label', "my label");
})

