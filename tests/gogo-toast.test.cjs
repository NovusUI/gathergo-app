const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { default: create } = require('twrnc/create');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { contrast } = require('./colorContrast.cjs');
const { getAppTheme } = loadTypeScript('utils/theme/index.ts', { twrnc: { create: config => create(config, 'ios') } });
let mode='light', width=390, insets={top:59,bottom:34,left:0,right:0}, os='ios', effects=[], announcements=[], displayed=[];
const toastModule={default:'Toast'};
const { default: AppToast, toastConfig } = loadTypeScript('components/ui/AppToast.tsx', {
  react:{...React,useEffect:effect=>effects.push(effect)},
  'react-native':{View:'View',Text:'Text',TouchableOpacity:'Button',useWindowDimensions:()=>({width}),Platform:{get OS(){return os;}},AccessibilityInfo:{announceForAccessibility:message=>announcements.push(message)}},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>insets},
  'react-native-toast-message':toastModule,
  '@/components/gogo/mascot/GatherGoMascot':{GatherGoMascot:'Gogo'},
  '@/hooks/useAppTheme':{useAppTheme:()=>getAppTheme(mode)},'lucide-react-native':{X:'Close'},
});
function render(node){if(typeof node?.type==='function')return render(node.type(node.props));if(!node||typeof node!=='object')return node;return{...node,props:{...node.props,children:[node.props.children].flat(Infinity).map(render)}};}
function* nodes(node){if(!node||typeof node!=='object')return;yield node;for(const child of [node.props?.children].flat(Infinity))yield* nodes(child);}
function toast(type,props={}){return render(toastConfig[type]({text1:'Update',text2:'Your event details have been saved.',isVisible:true,hide(){},onPress(){},...props}));}
test('all global toast types show Gogo, readable theme colors and the full message',()=>{
  const variants={success:'success',error:'error',warn:'pending',info:'idle'};
  const message='A longer notification stays readable and wraps across lines so the exact next step from the app can be read without being cut off.';
  for(mode of ['light','dark'])for(const type of Object.keys(variants)){
    const tree=toast(type,{text2:message});
    assert.equal([...nodes(tree)].find(n=>n.type==='Gogo').props.variant,variants[type]);
    const text=[...nodes(tree)].filter(n=>n.type==='Text');
    assert.ok(text.some(n=>n.props.children.includes(message)));
    assert.ok(text.every(n=>n.props.numberOfLines===undefined));
    for(const node of text)assert.ok(contrast(node.props.style.color,tree.props.style.backgroundColor)>=4.5,`${mode} ${type}: readable text`);
    assert.ok(tree.props.style.borderWidth>=1);
  }
});
test('toast card and close button dismiss independently while a body press preserves the supplied action',()=>{
  let hidden=0,pressed=0;
  const tree=toast('success',{hide:()=>hidden++,onPress:()=>pressed++});
  const buttons=[...nodes(tree)].filter(n=>n.type==='Button');
  buttons.find(n=>n.props.accessibilityLabel==='Dismiss notification').props.onPress();
  assert.equal(hidden,1);assert.equal(pressed,0);
  buttons.find(n=>n.props.accessibilityLabel!=='Dismiss notification').props.onPress();
  assert.equal(hidden,2);assert.equal(pressed,1);
});
test('toast widths follow safe window sizes and the shared host avoids the system status and navigation areas',()=>{
  for(const size of [320,390,700,1024]){
    width=size;insets={top:59,bottom:34,left:size===700?24:0,right:size===700?16:0};
    const card=toast('warn');assert.ok(card.props.style.width<=560);assert.equal(card.props.style.width,Math.min(size-insets.left-insets.right-32,560));
    const host=AppToast();assert.strictEqual(host.props.config,toastConfig);assert.equal(host.props.topOffset,71);assert.equal(host.props.bottomOffset,46);
  }
});
test('visible iOS notifications announce their actual message and hidden toasts stop Gogo animation',()=>{
  effects=[];announcements=[];os='ios';toast('error',{text1:'Could not save',text2:'Please try again.'});effects.forEach(effect=>effect());
  assert.deepEqual(announcements,['Could not save. Please try again.']);
  effects=[];const hidden=toast('error',{isVisible:false});effects.forEach(effect=>effect());
  assert.equal(announcements.length,1);assert.equal([...nodes(hidden)].find(n=>n.type==='Gogo').props.animated,false);
  os='android';effects=[];const android=toast('warn');effects.forEach(effect=>effect());assert.equal(announcements.length,1);
  assert.equal([...nodes(android)].find(n=>n.type==='Button').props.accessibilityLiveRegion,'polite');
});
const {showGlobalSuccess,showGlobalError,showGlobalWarning}=loadTypeScript('utils/globalErrorHandler.ts',{'react-native-toast-message':{default:{show:props=>displayed.push(props)}}});
test('existing success, error and warning helpers use the shared custom host without changing durations or messages',()=>{
  displayed=[];showGlobalSuccess('Saved',5);showGlobalError('Try again');showGlobalWarning('Check your details');
  assert.deepEqual(displayed.map(({type,text2,visibilityTime})=>({type,text2,visibilityTime})),[
    {type:'success',text2:'Saved',visibilityTime:5000},{type:'error',text2:'Try again',visibilityTime:4000},{type:'warn',text2:'Check your details',visibilityTime:3000},
  ]);
});
