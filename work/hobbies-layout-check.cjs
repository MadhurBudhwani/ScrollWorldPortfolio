const {chromium}=require('C:/Users/Madhur/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1536,height:864}});
await page.goto('http://127.0.0.1:4173/world.html?world=hobbies');
await page.waitForTimeout(600);
await page.evaluate(()=>{window.playableWorld.game.player.x=440;});
await page.waitForTimeout(100);
await page.keyboard.press('KeyE');
await page.waitForTimeout(500);
console.log(await page.locator('#worldDialog').getAttribute('open'));
await page.screenshot({path:'work/hobbies-revised-desktop.png'});
for(const size of [[1536,864],[1280,720],[1024,768],[844,390],[390,844]]){
 await page.setViewportSize({width:size[0],height:size[1]});
 if(await page.locator('.landscape-prompt[open]').count())await page.locator('.landscape-prompt button').click();
 for(const room of ['Writing','Singing','Gaming','Drawing','Graphic Design','Video Editing']){
  const select=page.locator('.hobby-room-select');
  if(await select.isVisible())await select.selectOption({label:room});else await page.getByRole('button',{name:room,exact:true}).click();
  await page.waitForTimeout(150);
  console.log(JSON.stringify({size,room,result:await page.evaluate(()=>[...document.querySelectorAll('#worldDialog, #hobbyGallery, .hobby-grid,.hobby-main,.hobby-side,.book-page,.art-viewport,.editing-monitor,.arcade-cabinet')].filter(n=>n.getClientRects().length).map(n=>({class:n.className||n.id,w:n.clientWidth,h:n.clientHeight,sh:n.scrollHeight,sw:n.scrollWidth}))) }));
 }
}
await browser.close();
})();
