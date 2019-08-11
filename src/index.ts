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

const list: {[name: string]: (sch: JOI.Schema, arg: any, desc: JOI.Description, opts: DeserializeOpts)=>JOI.Schema} = {
	"s|string": ()=>JOI.string(),
	"r|string:regex": (sch, arg)=>(sch as JOI.StringSchema).regex(arg.pattern, {name: arg.name, invert: arg.invert}),
	"r|string:min": (sch, arg)=>(sch as JOI.StringSchema).min(arg),
	"r|string:max": (sch, arg)=>(sch as JOI.StringSchema).max(arg),
	"r|string:token": (sch)=>(sch as JOI.StringSchema).token(),
	"r|string:alphanum": (sch)=>(sch as JOI.StringSchema).alphanum(),
	"r|string:base64": (sch)=>(sch as JOI.StringSchema).base64(),
	"r|string:creditCard": (sch)=>(sch as JOI.StringSchema).creditCard(),
	"r|string:dataUri": (sch)=>(sch as JOI.StringSchema).dataUri(),
	"r|string:email": (sch, arg)=>(sch as JOI.StringSchema).email(arg),
	"r|string:guid": (sch)=>(sch as JOI.StringSchema).guid(),
	"r|string:hex": (sch, arg, desc)=>(sch as JOI.StringSchema).hex({byteAligned: desc.flags && (desc.flags as any).byteAligned}), // can add flag
	"r|string:hostname": (sch)=>(sch as JOI.StringSchema).hostname(),
	"r|string:ip": (sch, arg)=>(sch as JOI.StringSchema).ip(arg),
	"r|string:isoDate": (sch)=>(sch as JOI.StringSchema).isoDate(),
	"r|string:lowercase": (sch)=>(sch as JOI.StringSchema).lowercase(), // will also convert to lowercase
	"r|string:length": (sch,arg)=>(sch as JOI.StringSchema).length(arg),
	"r|string:uuid": (sch)=>(sch as JOI.StringSchema).uuid(),
	"r|string:uppercase": (sch)=>(sch as JOI.StringSchema).uppercase(), // will also convert to uppercase
	"r|string:uri": (sch,arg)=>(sch as JOI.StringSchema).uri(arg),
	"r|string:trim": (sch,arg)=>(sch as any).trim(arg),
	"r|string:normalize": (sch,arg)=>(sch as any).normalize(arg),

	"f|string:case": (sch,arg)=>{
		// Ignore since flag is already applied by the lowercase/uppercase rule
		/*if(arg == "lower")
			return (sch as JOI.StringSchema).lowercase() // will also add a rule
		else if(arg == "upper")
			return (sch as JOI.StringSchema).uppercase() // will also add a rule
		else
			throw new Error("Unknown value for flag 'case': "+arg);
		*/
		return sch;
	},
	"f|string:insensitive": (sch)=>(sch as JOI.StringSchema).insensitive(),
	"f|string:byteAligned": sch=>sch, // Ignore since it is only set by rule hex
	"f|string:truncate": (sch, arg)=>(sch as JOI.StringSchema).truncate(arg),
	"f|string:trim": sch=>sch, // Ignore, will be set by rule
	"f|string:normalize": sch=>sch, // Ignore, will be set by rule

	"s|boolean": ()=>JOI.boolean(),
	"f|boolean:insensitive": (sch, arg)=>(sch as JOI.BooleanSchema).insensitive(arg),
	"o|boolean:truthy": (sch, arg)=>(sch as JOI.BooleanSchema).truthy(arg.filter((v: any)=>v!==true)),
	"o|boolean:falsy": (sch, arg)=>(sch as JOI.BooleanSchema).falsy(arg.filter((v: any)=>v!==false)),

	"s|binary": ()=>JOI.binary(),
	"f|binary:encoding": (sch, arg)=>(sch as JOI.BinarySchema).encoding(arg),
	"r|binary:min": (sch, arg)=>(sch as JOI.BinarySchema).min(arg),
	"r|binary:max": (sch, arg)=>(sch as JOI.BinarySchema).max(arg),
	"r|binary:length": (sch, arg)=>(sch as JOI.BinarySchema).length(arg),

	"s|date": ()=>JOI.date(),
	"r|date:min": (sch, arg)=>(sch as JOI.DateSchema).min(arg),
	"r|date:max": (sch, arg)=>(sch as JOI.DateSchema).max(arg),
	"r|date:greater": (sch, arg)=>(sch as JOI.DateSchema).greater(arg),
	"r|date:less": (sch, arg)=>(sch as JOI.DateSchema).less(arg),
	"f|date:format": (sch, arg)=>{
		const isoFormat = /^(?:[-+]\d{2})?(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/;
		if(arg.toString() != isoFormat.toString())
			throw new Error("Unknown date format!");
		return (sch as JOI.DateSchema).iso()
	},
	"f|date:timestamp": (sch, arg)=>(sch as JOI.DateSchema).timestamp(arg),
	"f|date:multiplier": (sch)=>sch, // Ignore will be set in f:timestamp

	"s|object": (sch, arg, desc)=>{
		if(desc.flags && (desc.flags as any).func)
			return JOI.func();
		return JOI.object();
	},
	"o|object:children": (sch, arg, desc, opts)=>{
		let obj: any = {};
		for(let p in arg){
			obj[p] = deserialize(arg[p], opts);
		}
		return (sch as JOI.ObjectSchema).keys(obj);
	},
	"r|object:min": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).min(arg),
	"r|object:max": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).max(arg),
	"r|object:length": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).length(arg),
	"o|object:patterns": (sch, arg, desc, opts)=>{
		for(let p of arg){
			let pat: any;
			if(p.regex)
				pat = str2regex(p.regex);
			sch = (sch as JOI.ObjectSchema).pattern(pat, deserialize(p.rule, opts));
		}
		return sch;
	},
	"o|object:dependencies": (sch, arg, desc, opts)=>{
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
				//case 'rename':

				//break;
				default:
					console.log(dep);
					throw new Error("Unknown object dependency:"+dep.type);
			}
		}
		return sch;
	},
	"o|object:renames": (sch, arg, desc, opts)=>{
		for(let rn of arg){
			if(rn.isRegExp && typeof rn.from == "string")
				rn.from = str2regex(rn.from);
			sch = (sch as JOI.ObjectSchema).rename(rn.from, rn.to, rn.options);
		}
		return sch;
	},
	"r|object:assert": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).assert(JOI.ref(arg.ref.substr(4)), deserialize(arg.schema, opts)),
	"f|object:allowUnknown": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).unknown(arg),
	"r|object:type": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).type(arg.ctor, arg.name),
	"r|object:schema": (sch, arg, desc, opts)=>(sch as JOI.ObjectSchema).schema(),


	// Following functions are actually for .func
	"f|object:func": sch=>sch, // flag func is handled above
	"r|object:arity": (sch, arg)=>(sch as JOI.FunctionSchema).arity(arg),
	"r|object:minArity": (sch, arg)=>(sch as JOI.FunctionSchema).minArity(arg),
	"r|object:maxArity": (sch, arg)=>(sch as JOI.FunctionSchema).maxArity(arg),
	"r|object:class": (sch, arg)=>(sch as any).class(),
	
	"s|array": ()=>JOI.array(),
	"f|array:sparse": (sch, arg)=>(sch as JOI.ArraySchema).sparse(arg),
	"f|array:single": (sch, arg)=>(sch as JOI.ArraySchema).single(arg),
	"o|array:items": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).items(
		...arg.map((a: any)=>deserialize(a, opts))
	),
	"o|array:orderedItems": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).ordered(
		...arg.map((a: any)=>deserialize(a, opts))
	),
	"r|array:min": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).min(arg),
	"r|array:max": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).max(arg),
	"r|array:length": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).length(arg),
	"r|array:unique": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).unique(arg.comparator||arg.path, {...arg}),
	"r|array:has": (sch, arg, desc, opts)=>(sch as JOI.ArraySchema).has(deserialize(arg, opts)),
	
	"s|number": ()=>JOI.number(),
	"f|number:unsafe": (sch, arg)=>(sch as JOI.NumberSchema).unsafe(arg),
	"r|number:min": (sch, arg)=>(sch as JOI.NumberSchema).min(arg),
	"r|number:max": (sch, arg)=>(sch as JOI.NumberSchema).max(arg),
	"r|number:greater": (sch, arg)=>(sch as JOI.NumberSchema).greater(arg),
	"r|number:less": (sch, arg)=>(sch as JOI.NumberSchema).less(arg),
	"r|number:integer": (sch, arg)=>(sch as JOI.NumberSchema).integer(),
	"f|number:precision": (sch, arg)=>sch, // handled below
	"r|number:precision": (sch, arg)=>(sch as JOI.NumberSchema).precision(arg),
	"r|number:multiple": (sch, arg)=>(sch as JOI.NumberSchema).multiple(arg),
	"r|number:positive": (sch, arg)=>(sch as JOI.NumberSchema).positive(),
	"r|number:negative": (sch, arg)=>(sch as JOI.NumberSchema).negative(),
	"r|number:port": (sch, arg)=>(sch as JOI.NumberSchema).port(),

	"s|symbol": ()=>JOI.symbol(),
	"o|symbol:map": (sch, arg, desc, opts)=>{
		if(!desc.flags || !(desc.flags as any).allowOnly)
			return sch;
		let symbolMap = opts.symbols || {};
		let arr = [];
		arg.forEach((k:any,v:any)=>{
			arr.push([k, symbolMap[k]||v]);
		});
		return (sch as JOI.SymbolSchema).map(arg);
	},

	"s|alternatives": (sch, arg, desc, opts)=>JOI.alternatives(),
	"o|alternatives:alternatives": (sch, arg, desc, opts)=>{
		if(arg.length == 0)
			return sch;
		arg = arg.map((a:any)=>deserialize(a, opts));
		return (sch as JOI.AlternativesSchema).try(...arg);
	},

	"s|any": ()=>JOI.any(),

	"f|allowOnly": sch=>sch, // Ignore, will be set in main func
	"f|raw": (sch,arg)=>sch.raw(arg),
	"f|empty": (sch,arg,desc)=>sch.empty(deserialize(arg)),
	"f|error": (sch, arg)=>sch.error(arg),
	"f|presence": (sch, arg)=>{
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
	"f|strip": (sch, arg)=>sch.strip(),
	"f|default": (sch, arg)=>sch.default(arg),
	"o|options": (sch, arg)=>sch.options(arg),
	"o|meta": (sch, arg)=>sch.meta(arg),
	"o|examples": (sch, arg)=>sch.example.apply(sch, arg.map((ex:any)=>[ex.value, ex.options])),
	"o|description": (sch, arg)=>sch.description(arg),
	"o|tags": (sch, arg)=>sch.tags(arg),
	"o|notes": (sch, arg)=>sch.notes(arg),
	"o|unit": (sch, arg)=>sch.unit(arg),
	"o|label": (sch, arg)=>sch.label(arg),
	"o|invalids": (sch, arg)=>(arg as any[]).reduce((prev,iv)=>prev.invalid(iv), sch),
	"o|valids": (sch, arg, desc)=>{
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
}
function applyRules(sch: JOI.Schema, desc: JOI.Description, opts: DeserializeOpts): JOI.Schema{
	let rules: {name: string, arg: any}[] = desc.rules;
	for(let {arg,name} of rules){
		let r = list['r|'+desc.type+":"+name];
		if(!r)
			r = list['r|'+name];
		if(!r)
			throw new Error("No rule found for "+name);
		sch = r(sch, arg, desc, opts);
	}
	return sch;
}

function applyFlags(sch: JOI.Schema, desc: JOI.Description, opts: DeserializeOpts){
	let flags: {[name: string]: any} = desc.flags as any;
	for(let flag in flags){
		let f = list['f|'+desc.type+":"+flag];
		if(!f)
			f = list['f|'+flag];
		if(!f){
			throw new Error("No flag found for "+flag);
		}
		sch = f(sch, flags[flag], desc, opts);
	}
	return sch;
}

function applyOpts(sch: JOI.Schema, desc: JOI.Description, opts: DeserializeOpts){
	let options: {[name: string]: any} = desc as any;
	for(let opt in options){
		if(['rules', 'flags', 'type'].indexOf(opt) > -1)
			continue;
		let o = list['o|'+desc.type+":"+opt];
		if(!o)
			o = list['o|'+opt];
		if(!o)
			throw new Error("No option found for "+opt);
		sch = o(sch, options[opt], desc, opts);
	}
	return sch;
}

export function deserialize(desc: JOI.Description, opts?: DeserializeOpts): JOI.Schema{
	opts = opts || {};
	let sch: JOI.Schema;
	let func = list['s|'+desc.type] as any;
	if(!func)
		throw new Error("Unknown joi schema type: "+desc.type);
	sch = func(null, null, desc, opts);
	sch = applyOpts(sch, desc, opts);
	if(desc.rules){
		sch = applyRules(sch, desc, opts);
	}
	if(desc.flags){
		sch = applyFlags(sch, desc, opts);
	}
	return sch;
}

