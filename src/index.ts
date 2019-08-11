import * as JOI from "joi";

export function serialize(joi: JOI.Schema){
	return joi.describe();
}

export interface DeserializeOpts{
	symbols?: {[key: string]: symbol}
}

function str2regex(pattern: string): RegExp{
	let flagLen = pattern.length - pattern.lastIndexOf("/") - 1;
	return new RegExp(pattern.substr(1,pattern.length-2-flagLen), pattern.substr(-flagLen));
}

type Handler<T extends JOI.Schema = JOI.Schema> = (sch: T, arg: any, desc: JOI.Description, opts: DeserializeOpts)=>T;
interface Type<T extends JOI.Schema = JOI.Schema>{
	create: (desc: JOI.Description, opts: DeserializeOpts)=>T,
	flags: {[flag: string]: Handler<T>},
	rules: {[rule: string]: Handler<T>},
	options: {[option: string]: Handler<T>},
	inherits?: string
}

const types: {[type: string]: Type} = {
	"string": {
		create: ()=>JOI.string(),
		inherits: "any",
		rules: {
			"regex": (sch, arg)=>(sch as JOI.StringSchema).regex(arg.pattern, {name: arg.name, invert: arg.invert}),
			"min": (sch, arg)=>(sch as JOI.StringSchema).min(arg),
			"max": (sch, arg)=>(sch as JOI.StringSchema).max(arg),
			"token": (sch)=>(sch as JOI.StringSchema).token(),
			"alphanum": (sch)=>(sch as JOI.StringSchema).alphanum(),
			"base64": (sch)=>(sch as JOI.StringSchema).base64(),
			"creditCard": (sch)=>(sch as JOI.StringSchema).creditCard(),
			"dataUri": (sch)=>(sch as JOI.StringSchema).dataUri(),
			"email": (sch, arg)=>(sch as JOI.StringSchema).email(arg),
			"guid": (sch)=>(sch as JOI.StringSchema).guid(),
			"hex": (sch, arg, desc)=>(sch as JOI.StringSchema).hex({byteAligned: desc.flags && (desc.flags as any).byteAligned}), // can add flag
			"hostname": (sch)=>(sch as JOI.StringSchema).hostname(),
			"ip": (sch, arg)=>(sch as JOI.StringSchema).ip(arg),
			"isoDate": (sch)=>(sch as JOI.StringSchema).isoDate(),
			"lowercase": (sch)=>(sch as JOI.StringSchema).lowercase(), // will also convert to lowercase
			"length": (sch,arg)=>(sch as JOI.StringSchema).length(arg),
			"uuid": (sch)=>(sch as JOI.StringSchema).uuid(),
			"uppercase": (sch)=>(sch as JOI.StringSchema).uppercase(), // will also convert to uppercase
			"uri": (sch,arg)=>(sch as JOI.StringSchema).uri(arg),
			"trim": (sch,arg)=>(sch as any).trim(arg),
			"normalize": (sch,arg)=>(sch as any).normalize(arg),
		},
		options:{},
		flags:{
			"case": (sch,arg)=>sch, // Ignore since flag is already applied by the lowercase/uppercase rule
			"insensitive": (sch)=>(sch as JOI.StringSchema).insensitive(),
			"byteAligned": sch=>sch, // Ignore since it is only set by rule hex
			"truncate": (sch, arg)=>(sch as JOI.StringSchema).truncate(arg),
			"trim": sch=>sch, // Ignore, will be set by rule
			"normalize": sch=>sch, // Ignore, will be set by rule
		}
	},
	"boolean": {
		create: ()=>JOI.boolean(),
		inherits: "any",
		rules: {},
		options: {
			"truthy": (sch, arg)=>(sch as JOI.BooleanSchema).truthy(arg.filter((v: any)=>v!==true)),
			"falsy": (sch, arg)=>(sch as JOI.BooleanSchema).falsy(arg.filter((v: any)=>v!==false))
		},
		flags: {
			"insensitive": (sch, arg)=>(sch as JOI.BooleanSchema).insensitive(arg),
		}
	},
	"binary": {
		create: ()=>JOI.binary(),
		inherits: "any",
		rules: {
			"min": (sch, arg)=>(sch as JOI.BinarySchema).min(arg),
			"max": (sch, arg)=>(sch as JOI.BinarySchema).max(arg),
			"length": (sch, arg)=>(sch as JOI.BinarySchema).length(arg),
		},
		options: {},
		flags: {
			"encoding": (sch, arg)=>(sch as JOI.BinarySchema).encoding(arg),
		}
	},
	"date": {
		create: ()=>JOI.date(),
		inherits: "any",
		rules: {
			"min": (sch, arg)=>(sch as JOI.DateSchema).min(arg),
			"max": (sch, arg)=>(sch as JOI.DateSchema).max(arg),
			"greater": (sch, arg)=>(sch as JOI.DateSchema).greater(arg),
			"less": (sch, arg)=>(sch as JOI.DateSchema).less(arg),
		},
		options: {},
		flags: {
			"format": (sch, arg)=>{
				const isoFormat = /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/;
				if(arg.toString() != isoFormat.toString())
					throw new Error("Unknown date format!");
				return (sch as JOI.DateSchema).iso()
			},
			"timestamp": (sch, arg)=>(sch as JOI.DateSchema).timestamp(arg),
			"multiplier": (sch)=>sch, // Ignore will be set in f:timestamp
		}
	},
	"object": {
		create: (desc)=>{
			if(desc.flags && (desc.flags as any).func)
				return JOI.func();
			return JOI.object();
		},
		inherits: "any",
		rules: {
			"min": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).min(arg),
			"max": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).max(arg),
			"length": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).length(arg),
			"assert": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).assert(JOI.ref(arg.ref.substr(4)), deserialize(arg.schema, opts)),
			"type": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).type(arg.ctor, arg.name),
			"schema": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).schema(),
			
			// Following functions are actually for .func type
			"arity": (sch, arg)=>(sch as JOI.FunctionSchema).arity(arg),
			"minArity": (sch, arg)=>(sch as JOI.FunctionSchema).minArity(arg),
			"maxArity": (sch, arg)=>(sch as JOI.FunctionSchema).maxArity(arg),
			"class": (sch, arg)=>(sch as any).class()
		},
		options: {
			"children": (sch, arg, desc, opts)=>{
				let obj: any = {};
				for(let p in arg){
					obj[p] = deserialize(arg[p], opts);
				}
				return (sch as JOI.ObjectSchema).keys(obj);
			},
			"patterns": (sch, arg, desc, opts)=>{
				for(let p of arg){
					let pat: any;
					if(p.regex)
						pat = str2regex(p.regex);
					sch = (sch as JOI.ObjectSchema).pattern(pat, deserialize(p.rule, opts));
				}
				return sch;
			},
			"dependencies": (sch, arg, desc, opts)=>{
				for(let dep of arg){
					switch(dep.type){
						case 'and':
						case 'nand':
						case 'or':
						case 'xor':
						case 'oxor':
							sch = (sch as any)[dep.type](...dep.peers);
						break;
						case 'with':
						case 'without':
							sch = (sch as any)[dep.type](dep.key, ...dep.peers);
						break;
						default:
							throw new Error("Unknown object dependency:"+dep.type);
					}
				}
				return sch;
			},
			"renames": (sch, arg, desc, opts)=>{
				for(let rn of arg){
					if(rn.isRegExp && typeof rn.from == "string")
						rn.from = str2regex(rn.from);
					sch = (sch as JOI.ObjectSchema).rename(rn.from, rn.to, rn.options);
				}
				return sch;
			},
		},
		flags: {
			"allowUnknown": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).unknown(arg),
			"func": sch=>sch, // flag func is handled in create function above
		}
	},
	"array": {
		create: ()=>JOI.array(),
		inherits: "any",
		rules: {
			"min": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).min(arg),
			"max": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).max(arg),
			"length": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).length(arg),
			"unique": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).unique(arg.comparator||arg.path, {...arg}),
			"has": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).has(deserialize(arg, opts))
		},
		options: {
			"items": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).items(
				...arg.map((a: any)=>deserialize(a, opts))
			),
			"orderedItems": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).ordered(
				...arg.map((a: any)=>deserialize(a, opts))
			),
		},
		flags: {
			"sparse": (sch, arg)=>(sch as JOI.ArraySchema).sparse(arg),
			"single": (sch, arg)=>(sch as JOI.ArraySchema).single(arg)
		}
	},
	"number": {
		create: ()=>JOI.number(),
		inherits: "any",
		rules: {
			"min": (sch, arg)=>(sch as JOI.NumberSchema).min(arg),
			"max": (sch, arg)=>(sch as JOI.NumberSchema).max(arg),
			"greater": (sch, arg)=>(sch as JOI.NumberSchema).greater(arg),
			"less": (sch, arg)=>(sch as JOI.NumberSchema).less(arg),
			"integer": (sch, arg)=>(sch as JOI.NumberSchema).integer(),
			"precision": (sch, arg)=>(sch as JOI.NumberSchema).precision(arg),
			"multiple": (sch, arg)=>(sch as JOI.NumberSchema).multiple(arg),
			"positive": (sch, arg)=>(sch as JOI.NumberSchema).positive(),
			"negative": (sch, arg)=>(sch as JOI.NumberSchema).negative(),
			"port": (sch, arg)=>(sch as JOI.NumberSchema).port()
		},
		flags:{
			"unsafe": (sch, arg)=>(sch as JOI.NumberSchema).unsafe(arg),
			"precision": (sch, arg)=>sch, // handled in rule.precision
		},
		options: {}
	},
	"symbol":{
		create: ()=>JOI.symbol(),
		inherits: "any",
		options:{
			"map": (sch, arg, desc, opts)=>{
				if(!desc.flags || !(desc.flags as any).allowOnly)
					return sch;
				let symbolMap = opts.symbols || {};
				let arr = [];
				arg.forEach((k:any,v:any)=>{
					arr.push([k, symbolMap[k]||v]);
				});
				return (sch as JOI.SymbolSchema).map(arg);
			}
		},
		rules: {},
		flags: {}
	},
	"alternatives": {
		create: ()=>JOI.alternatives(),
		inherits: "any",
		options:{
			"alternatives": (sch, arg, desc, opts)=>{
				if(arg.length == 0)
					return sch;
				arg = arg.map((a:any)=>deserialize(a, opts));
				return (sch as JOI.AlternativesSchema).try(...arg);
			},
		},
		flags: {},
		rules: {}
	},
	"any": {
		create: ()=>JOI.any(),
		options: {
			"options": (sch, arg)=>sch.options(arg),
			"meta": (sch, arg)=>sch.meta(arg),
			"examples": (sch, arg)=>sch.example.apply(sch, arg.map((ex:any)=>[ex.value, ex.options])),
			"description": (sch, arg)=>sch.description(arg),
			"tags": (sch, arg)=>sch.tags(arg),
			"notes": (sch, arg)=>sch.notes(arg),
			"unit": (sch, arg)=>sch.unit(arg),
			"label": (sch, arg)=>sch.label(arg),
			"invalids": (sch, arg)=>(arg as any[]).reduce((prev,iv)=>prev.invalid(iv), sch),
			"valids": (sch, arg, desc)=>{
				if(desc.flags && (desc.flags as any).allowOnly)
					for(let valid of arg){
						sch = sch.only(valid)
					}
				else
					for(let valid of arg){
						sch = sch.allow(valid)
					}
				return sch;
			}
		},
		flags: {
			"allowOnly": sch=>sch, // Ignore, will be set in main func
			"raw": (sch,arg)=>sch.raw(arg),
			"empty": (sch,arg,desc)=>sch.empty(deserialize(arg)),
			"error": (sch, arg)=>sch.error(arg),
			"presence": (sch, arg)=>{
				if(arg == "required"){
					sch = sch.required();
				}else if(arg == "optional"){
					sch = sch.optional();
				}else if(arg == "forbidden"){
					sch = sch.forbidden();
				}else{
					throw new Error("invalid presence flag: "+arg);
				}
				return sch;
			},
			"strip": (sch, arg)=>sch.strip(),
			"default": (sch, arg)=>sch.default(arg),
		},
		rules: {}
	}
};

function getRule(to: Type, rule: string): Handler{
	let r: Handler;
	do{
		r = to.rules[rule];
		to = types[to.inherits||""];
	}while(!r && to);
	if(!r)
		throw new Error("No rule handler found for "+rule);
	return r;
}
function getFlag(to: Type, flag: string): Handler{
	let f: Handler;
	do{
		f = to.flags[flag];
		to = types[to.inherits||""];
	}while(!f && to);
	if(!f)
		throw new Error("No flag handler found for "+flag);
	return f;
}
function getOption(to: Type, option: string): Handler{
	let o: Handler;
	do{
		o = to.options[option];
		to = types[to.inherits||""];
	}while(!o && to);
	if(!o)
		throw new Error("No option handler found for "+option);
	return o;
}

export function deserialize(desc: JOI.Description, opts?: DeserializeOpts): JOI.Schema{
	opts = opts || {};
	let sch: JOI.Schema;
	let type = types[desc.type as string];
	if(!type)
		throw new Error("Unknown joi schema type: "+desc.type);
	sch = type.create(desc, opts);
	for(let op in desc){
		if(['rules', 'flags', 'type'].indexOf(op) > -1)
			continue;
		sch = getOption(type, op)(sch, desc[op], desc, opts);
	}
	if(desc.rules) for(let {arg,name} of desc.rules){
		sch = getRule(type, name)(sch, arg, desc, opts);
	}
	if(desc.flags) for(let fl in desc.flags){
		sch = getFlag(type, fl)(sch, (desc.flags as any)[fl], desc, opts);
	}
	return sch;
}

