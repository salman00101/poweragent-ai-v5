import {json,authorized} from './_lib.js';export async function onRequestGet({request,env}){return json({authenticated:await authorized(request,env)})}
