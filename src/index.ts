import * as JOI from "joi";

export function serialize(joi: JOI.Schema){
	return joi.describe();
}


const list: {[name: string]: (sch: JOI.Schema, arg: any, desc: JOI.Description)=>JOI.Schema} = {
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

	"f|boolean:insensitive": (sch, arg)=>(sch as JOI.BooleanSchema).insensitive(arg),
	"o|boolean:truthy": (sch, arg)=>(sch as JOI.BooleanSchema).truthy(arg.filter((v: any)=>v!==true)),
	"o|boolean:falsy": (sch, arg)=>(sch as JOI.BooleanSchema).falsy(arg.filter((v: any)=>v!==false)),

	"f|allowOnly": sch=>sch, // Ignore, will be set in main func
	"f|raw": (sch,arg)=>sch.raw(arg),
	"f|empty": (sch,arg,desc)=>sch.empty(deserialize(arg)),
	"f|error": (sch, arg)=>sch.error(arg),
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
function applyRules(sch: JOI.Schema, desc: JOI.Description): JOI.Schema{
	let rules: {name: string, arg: any}[] = desc.rules;
	for(let {arg,name} of rules){
		let r = list['r|'+desc.type+":"+name];
		if(!r)
			r = list['r|'+name];
		if(!r)
			throw new Error("No rule found for "+name);
		sch = r(sch, arg, desc);
	}
	return sch;
}

function applyFlags(sch: JOI.Schema, desc: JOI.Description){
	let flags: {[name: string]: any} = desc.flags as any;
	for(let flag in flags){
		let f = list['f|'+desc.type+":"+flag];
		if(!f)
			f = list['f|'+flag];
		if(!f)
			throw new Error("No flag found for "+flag);
		sch = f(sch, flags[flag], desc);
	}
	return sch;
}

function applyOpts(sch: JOI.Schema, desc: JOI.Description){
	let options: {[name: string]: any} = desc as any;
	for(let opt in options){
		if(['rules', 'flags', 'type'].indexOf(opt) > -1)
			continue;
		let o = list['o|'+desc.type+":"+opt];
		if(!o)
			o = list['o|'+opt];
		if(!o)
			throw new Error("No option found for "+opt);
		sch = o(sch, options[opt], desc);
	}
	return sch;
}

export function deserialize(desc: JOI.Description): JOI.Schema{
	let sch: JOI.Schema;
	switch(desc.type){
		case "string":
			sch = JOI.string();
		break;
		case "any":
			sch = JOI.any();
		break;
		case "boolean":
			sch = JOI.bool();
		break;
		default:
			throw new Error("Unknown joi schema type: "+desc.type);
	}
	sch = applyOpts(sch, desc);
	if(desc.rules){
		sch = applyRules(sch, desc);
	}
	if(desc.flags){
		sch = applyFlags(sch, desc)
	}
	return sch;
}

