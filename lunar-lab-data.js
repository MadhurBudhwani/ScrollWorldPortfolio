// Small, local fixtures. These experiments do not call an AI model, database or external service.
(() => {
  const definitions={
    search:{number:'01',title:'Find Answers in Documents',purpose:'Instead of opening several documents and searching each one, you can ask a question and find the information you need.\n\nChoose a sample question below, then click Find an answer. Watch the system select relevant passages and show an answer with its sources. If the documents don’t contain the answer, it will tell you.',skill:'RAG · EMBEDDINGS · RETRIEVAL',action:'Find an answer',
      groups:[{label:'Choose a question',options:['How do I deploy a release?','How is access controlled?','What is the refund policy?']}],
      build:'I connect document ingestion, embedding-based retrieval and scoped search APIs. Relevant passages become the context for an answer; source references make that answer inspectable. This console uses fixed sample passages and illustrative match scores.',
      principle:'The answer should come from the documents, with sources you can check.'},
    data:{number:'02',title:'Ask Questions About Your Data',purpose:'You don’t need to write database commands to ask questions about business data. Here, you can explore a small set of sample orders.\n\nChoose whether you want to see monthly order activity or compare regions, then click Show the results. Watch your question become a checked database query and a simple chart.',skill:'NL → SQL · SCHEMA CONTEXT · VALIDATION',action:'Show the results',
      groups:[{label:'Choose an analysis',options:['Monthly order trend','Orders by region']}],
      build:'My NL-to-SQL pipeline resolves intent and schema context, applies business rules, then generates, validates and corrects a query before controlled execution. Database permissions still apply at execution. Here, six fictional rows are aggregated locally; the SQL is an illustration.',
      principle:'Check the database command and use only the information this person is allowed to see.'},
    automate:{number:'03',title:'Automate Everyday Tasks',purpose:'Routine events often create follow-up work: a meeting needs a summary, or an updated task needs a reminder.\n\nChoose an event and the follow-up you want, then click Try the workflow. Watch the system gather the relevant information and prepare a draft for review. This demo won’t send any messages or create reminders.',skill:'API INTEGRATION · BACKGROUND SYNC · COMMANDS',action:'Try the workflow',
      groups:[{label:'When this happens',options:['Meeting ends','Work item changes']},{label:'Prepare this action',options:['Team summary','Follow-up reminder']}],
      build:'I integrate workplace APIs with authenticated sessions, configurable commands and background sync. Each step records its outcome so failures can be found and retried. These example workflows prepare local previews only; no messages or calendar events are sent.',
      principle:'Review the prepared draft before anything is sent or scheduled.'},
    agents:{number:'04',title:'Give an AI Assistant a Task',purpose:'Some tasks need information from more than one place. An AI assistant can break a request into smaller steps, use the appropriate tools and bring the results together.\n\nChoose a sample task, then click Start the task. Watch the assistant follow its plan and prepare a briefing or daily agenda for you to review.',skill:'PLANNING · TOOL SELECTION · MULTI-STEP EXECUTION',action:'Start the task',
      groups:[{label:'Assign a mission',options:['Prepare a release briefing','Plan my morning']}],
      build:'I connect assistant requests to retrieval and workplace tools, with session context and request history. This experiment illustrates an agent pattern: choose a plan, call only the necessary tools, combine the evidence and prepare an output for review.',
      principle:'Gather the information, prepare a useful draft, then let the person review it.'},
    trust:{number:'05',title:'Check Answers and Protect Private Data',purpose:'A useful AI system should respect access permissions and avoid making up answers.\n\nChoose a sample request, then click Check this request. You’ll see whether the information is allowed and whether there is enough evidence to answer. Try the different requests to compare a supported answer, an access refusal and a request that needs more information.',skill:'ACCESS CONTROL · GROUNDING · VALIDATION',action:'Check this request',
      groups:[{label:'Try a request',options:['My team’s order count','Another team’s private data','Predict next year’s revenue']}],
      build:'I implement scoped access using SQL Server row-level security, session context and permission-aware APIs. Query validation and correction happen before controlled execution. This simulation demonstrates separate permission and evidence checks; it is not a production security test.',
      principle:'Say when information is private or when there isn’t enough evidence to answer.'},
    reliable:{number:'06',title:'Keep AI Fast and Reliable',purpose:'Repeated questions shouldn’t always require the same work, and a temporary failure shouldn’t immediately end a request.\n\nStart with Normal request, then click Run this example. Next, try Repeat request to see a saved answer reused. You can also choose Simulate a timeout to watch a failed attempt recover. The timings shown are illustrative.',skill:'CACHING · TELEMETRY · FEEDBACK',action:'Run this example',
      groups:[{label:'Choose a condition',options:['Normal request','Repeat request','Simulate a timeout']}],
      build:'I use semantic caching, failed-query logging and pipeline tracing to understand behavior and latency. This console uses a single local cache entry and a bounded retry example. All durations are fictional teaching values, not measurements or portfolio performance claims.',
      principle:'Reuse an answer only for someone with the same permissions, and limit repeat attempts.'}
  };
  const documents=[
    {id:'D1',title:'Release playbook',text:'Deploy to staging, run smoke checks, then promote the reviewed build.'},
    {id:'D2',title:'Access guide',text:'Authenticate the user and apply workspace permissions before retrieving data.'},
    {id:'D3',title:'Operations notes',text:'Keep deployment history. Record the caller’s scope in request traces.'}
  ];
  const orders=[{month:'Jan',region:'West',count:12},{month:'Jan',region:'North',count:8},{month:'Feb',region:'West',count:18},{month:'Feb',region:'North',count:12},{month:'Mar',region:'West',count:24},{month:'Mar',region:'North',count:16}];
  const stage=(label,detail)=>({label,detail});
  function evaluate(id,selection=[0,0],session={cached:false}){
    const choice=selection[0]||0;
    if(id==='search'){
      const matches=choice===0?[0,2]:choice===1?[1,2]:[];
      return {kind:id,matches,documents,question:definitions[id].groups[0].options[choice],tone:matches.length?'success':'notice',
        stages:[stage('Read documents','Read three sample documents.'),stage('Find relevant text',matches.length?'Relevant passages selected; unrelated text stays out.':'No passage supports this question.'),stage('Check the sources',matches.length?'Build an answer from the selected evidence.':'Stop before inventing an answer.')],
        title:matches.length?'Evidence attached':'No supported answer',answer:choice===0?'Deploy to staging, run smoke checks, then promote the reviewed build. Keep a deployment history. [D1, D3]':choice===1?'Authenticate the user and apply workspace permissions before retrieval. Record the caller’s scope in traces. [D2, D3]':'These documents do not contain a refund policy. Add a policy source or ask a different question.',sources:matches.map(i=>documents[i]),metric:matches.length+' / 3 sources selected'};
    }
    if(id==='data'){
      const field=choice===0?'month':'region',totals={};for(const row of orders)totals[row[field]]=(totals[row[field]]||0)+row.count;
      const bars=Object.entries(totals).map(([label,value])=>({label,value}));
      const sql=`SELECT ${field}, SUM(order_count) AS total\nFROM scoped_orders\nGROUP BY ${field};`;
      return {kind:id,field,bars,sql,rows:orders,tone:'success',stages:[stage('Find the data','Select the month, region and order count from the sample orders.'),stage('Check the request','Check that the command only reads allowed information and uses fields that exist.'),stage('Show the totals','Add up six fictional order records belonging to this team.')],title:choice===0?'Orders grow month by month':'A regional view of the same data',answer:bars.map(b=>b.label+': '+b.value+' orders').join(' · '),metric:'90 total orders · sample team only'};
    }
    if(id==='automate'){
      const trigger=choice===0?'Meeting ends':'Work item changes',destination=selection[1]===1?'Follow-up reminder':'Team summary';
      const source=choice===0?'Meeting notes':'Work item history';
      return {kind:id,trigger,destination,source,tone:'success',stages:[stage('Notice the event',trigger+' starts this sample workflow.'),stage('Gather information','Read '+source.toLowerCase()+' and extract the useful changes.'),stage('Prepare a draft','Prepare the '+destination.toLowerCase()+' for review; nothing is sent.')],title:destination+' ready to review',answer:destination==='Team summary'?(choice===0?'Release review: smoke checks passed. Owner: Dev team. Next step: approve the staging build.':'Work item #42 moved to Ready for QA. Owner: Test team. Next step: run the regression checks.'):(choice===0?'Reminder draft: review the staging build tomorrow at 10:00.':'Reminder draft: follow up on work item #42 after the QA run.'),metric:'1 event → 1 prepared draft · 0 external actions'};
    }
    if(id==='agents'){
      const tools=choice===0?['Search docs','Read work items','Compose brief']:['Read calendar','Find priorities','Compose agenda'];
      return {kind:id,tools,mission:definitions[id].groups[0].options[choice],tone:'success',stages:[stage('Make a plan','Break the task into three smaller steps.'),stage('Gather information',tools[0]+' and '+tools[1].toLowerCase()+' return sample evidence.'),stage('Prepare the result',tools[2]+' creates a draft from those tool results.')],title:choice===0?'Release briefing assembled':'Morning plan assembled',answer:choice===0?'Build 24 is ready for review. Smoke checks passed; one QA task remains. Recommended next step: review the open task before release.':'09:30 stand-up → review two priority work items → 11:00 design discussion. A 45-minute focus block is available between meetings.',metric:'3 tool steps · review before acting'};
    }
    if(id==='trust'){
      return {kind:id,choice,tone:choice===0?'success':choice===1?'blocked':'notice',gates:choice===0?['PASS','PASS','PASS']:choice===1?['DENY','SKIP','SKIP']:['PASS','NO SOURCE','STOP'],stages:[stage('Check permission',choice===1?'This person is not allowed to see the other team’s information.':'This person is allowed to see the requested information.'),stage('Check the facts',choice===1?'No private information is read after access is refused.':choice===2?'Past order counts are not enough to predict next year’s revenue.':'The sample order summary supports an answer.'),stage('Explain the answer',choice===0?'Show an answer based on information this person is allowed to see.':'Explain the limit without exposing or inventing data.')],title:choice===0?'Allowed and supported':choice===1?'Access denied':'More evidence needed',answer:choice===0?'Your team has 90 orders in the three-month sample. Other teams’ rows are not included.':choice===1?'This request needs access to another team. No private rows were retrieved. Ask for approved access or query your own team.':'This sample has no forecast model or revenue assumptions. I can summarize historical orders, but cannot support that prediction.',metric:choice===1?'Stopped at permissions · 0 data reads':choice===2?'No prediction made up':'Permission and source checks passed'};
    }
    if(id==='reliable'){
      const hit=choice===1&&session.cached,timeout=choice===2;
      const duration=hit?24:timeout?980:640;
      return {kind:id,hit,timeout,duration,cacheOnComplete:true,tone:timeout?'notice':'success',stages:[stage('Look for a saved answer',hit?'The same question and permissions match a saved answer.':'This run needs a fresh answer.'),stage(timeout?'Try once more':'Find the answer',hit?'Reuse the saved answer without searching again.':timeout?'The first attempt takes too long. One more attempt succeeds.':'Find the sample information and prepare an answer.'),stage('Show what happened','Show whether an answer was reused, whether another attempt was needed and the example timing.')],title:hit?'Same answer, less work':timeout?'A second attempt succeeded':'Fresh answer prepared',answer:hit?'A saved answer returned the same 90-order sample result for the same team. The system did not need to search or create the answer again.':timeout?'The first attempt timed out; the second returned the 90-order sample result. Both attempts remain visible in the trace.':'The system found 90 orders in the sample and saved the answer. Choose Repeat request next to see that answer reused.',metric:duration+' ms simulated · '+(hit?'saved answer reused':timeout?'2 attempts':'fresh answer')};
    }
    throw new Error('Unknown lunar experiment: '+id);
  }
  window.LunarLabData={definitions,evaluate};
})();
