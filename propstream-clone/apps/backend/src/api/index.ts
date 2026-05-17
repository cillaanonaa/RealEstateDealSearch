import express from 'express';
import { criteriaService } from '../services/criteriaService';
import { propertyService } from '../services/propertyService';
import { scoreProperty } from '../services/scoringService';

const app = express(); app.use(express.json());
app.get('/health', (_req,res)=>res.json({status:'ok'}));
app.get('/states', (_req,res)=>res.json(criteriaService.all()));
app.get('/states/:code', (req,res)=>{const s=criteriaService.byCode(req.params.code); if(!s) return res.status(404).json({error:'not found'}); res.json(s);});
app.post('/search', (req,res)=>{const {stateCode,riskSlider=50}=req.body; const criteria=criteriaService.byCode(stateCode); if(!criteria) return res.status(404).json({error:'state not found'}); const properties=propertyService.search(stateCode).map(p=>({ ...p, scores: scoreProperty(criteria,p,riskSlider)})).sort((a,b)=>b.scores.finalAdjustedInvestmentScore-a.scores.finalAdjustedInvestmentScore); res.json({state:stateCode,riskSlider,properties});});
app.get('/properties/:id',(req,res)=>{const p=propertyService.byId(req.params.id); if(!p) return res.status(404).json({error:'not found'}); const c=criteriaService.byCode(p.stateCode)!; res.json({property:p,scores:scoreProperty(c,p,50)});});
app.listen(4000,()=>console.log('api on 4000'));
