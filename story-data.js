/* Shared content; each experience owns its layout and choreography. */
window.PortfolioChapters = [
  { key: 'boot', kicker: 'Backend & GenAI engineer', title: 'Engineering systems.\nWriting worlds.', body: 'Backend and GenAI engineer. Five years building with .NET, SQL Server and Azure. A storyteller after hours.', mode: 'orbit', skills: ['BACKEND', 'AZURE CLOUD', 'GEN AI', 'ARCHITECT'], color: 0,
    introMessage: { title:'MADHUR BUDHWANI', description:"I'm Madhur, a backend and GenAI engineer. I build systems and write worlds." },
    messages: [
      { title:'BACKEND', description:'I build dependable .NET services where clean APIs, data access and production reliability work as one system.' },
      { title:'AZURE CLOUD', description:'I take those systems into Azure—shipping, observing and scaling them with the right managed services.' },
      { title:'GEN AI', description:'I turn models into useful products through grounded retrieval, validation and workflows that hold up beyond a demo.' },
      { title:'ARCHITECT', description:'I connect decisions across data, security and delivery so the whole system stays understandable as it grows.' },
    ],
    finalMessage: { title:'NEXT: BACKEND', description:"That's the surface. Let me show you what keeps it all running." },
    timeline: { nodeStart:.06, nodeStep:.13, nodeDuration:.12, dialogueHalf:.025, finalMessageStart:.60, portalHintStart:.65, bubbleHideStart:.82, portalComplete:.85 }
  },
  { key: 'backend', kicker: '01 / Backend engineering', title: 'Behind every request,\na working system.', body: '.NET 10, EF Core and SQL Server. Secure data access, background processing and production delivery.', mode: 'procession', skills: ['.NET 10', 'EF CORE', 'SQL SERVER', 'RLS', 'DATABASE ENCRYPTION', 'EF INTERCEPTORS', 'SESSION INTERCEPTORS', 'REDIS', 'BACKGROUND JOBS', 'CI/CD', 'DESKTOP APPS'], color: 1 },
  { key: 'azure', kicker: '02 / Cloud delivery', title: 'From a commit\nto the cloud.', body: 'App Services, Functions and Azure SQL. Connected through SignalR, API Management, Entra ID and Microsoft Graph.', mode: 'reel', skills: ['APP SERVICE', 'FUNCTIONS', 'AZURE SQL', 'BLOB STORAGE', 'SIGNALR', 'API MANAGEMENT', 'ENTRA ID', 'MICROSOFT GRAPH', 'COGNITIVE SERVICES'], color: 1 },
  { key: 'security', kicker: '03 / Security architecture', title: 'The right data.\nThe right access.', body: 'Data access controls, role permissions and tenant isolation. Auditable execution and AES encryption.', mode: 'gates', skills: ['ROLE PERMISSIONS', 'MULTI-TENANT', 'DATA ACCESS CONTROL', 'AES ENCRYPTION', 'AUDIT TRAIL'], color: 2 },
  { key: 'search', kicker: '04 / Search intelligence', title: 'Make knowledge\nfindable.', body: 'Azure AI Search across documents, attachments and work items. Exact, fuzzy, semantic and vector retrieval.', mode: 'spiral', skills: ['EXACT', 'FUZZY', 'SEMANTIC', 'VECTOR'], color: 1 },
  { key: 'genai', kicker: '05 / Generative AI', title: 'From a question\nto a useful answer.', body: 'Schema RAG, NL-to-SQL, KPI catalogs, validation and correction loops, RLS-aware execution, semantic cache and full pipeline telemetry.', mode: 'circuit', skills: ['AUTH','INTENT','ROUTER','SCHEMA RAG','LLM','VALIDATE','CORRECT','RLS EXECUTE','VISUALIZE','RESPOND'], color: 0 },
  { key: 'delivery', kicker: '06 / Engineering ownership', title: 'Build. Review.\nRelease. Repeat.', body: '1,200+ commits and 400+ merged PRs. Client-facing API ownership and release coordination through QA, UAT and production.', mode: 'crossing', skills: ['DEV', 'REVIEW', 'QA', 'UAT', 'PRODUCTION'], color: 2 },
  { key: 'writing', kicker: '07 / BEYOND CODE', title: 'The book keeps more than code.', body: 'Writing. Singing. Gaming. Drawing. Graphic design. Video editing. What the engineer does when nothing needs shipping.', mode: 'fusion', skills: ['WRITING', 'SINGING', 'GAMING', 'DRAWING', 'GRAPHIC DESIGN', 'VIDEO EDITING'], color: 3 },
  { key: 'hub', kicker: '08 / Explore further', title: 'Choose a world.', body: '', mode: 'hub', skills: [], color: 0 },
];
