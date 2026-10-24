const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { loadTypeScript } = require('./loadTypeScript.cjs');
let states=[],cursor=0;
const hooks={...React,useEffect(){},useState(initial){const i=cursor++;if(!(i in states))states[i]=initial;return[states[i],value=>{states[i]=value;}];}};
const reanimated={default:{createAnimatedComponent:type=>type},cancelAnimation(){},useAnimatedProps:fn=>fn(),useSharedValue:value=>({value}),withTiming:value=>value};
const tw=()=>({});
const {default:LineChart}=loadTypeScript('components/ui/LineChart.tsx',{
  react:hooks,'react-native':{View:'View',Text:'Text'},'react-native-svg':{default:'Svg',Circle:'Point',Line:'Grid',Path:'Path'},'react-native-reanimated':reanimated,
  '@/hooks/useAppTheme':{useAppTheme:()=>({tw,color:color=>color})},
});
function* nodes(node){if(!node||typeof node!=='object')return;yield node;for(const child of [node.props?.children].flat(Infinity))yield* nodes(child);}
const all=tree=>[...nodes(tree)];
function draw(data){cursor=0;return LineChart({data,valueKey:'amount',label:'Donations'});}
test('a dashboard chart uses its measured column, updates on resize, and keeps each point interactive',()=>{
  states=[];const data=[{day:'Mon',amount:20},{day:'Tue',amount:30}];
  let tree=draw(data);tree.props.onLayout({nativeEvent:{layout:{width:300}}});tree=draw(data);
  assert.equal(all(tree).find(n=>n.type==='Svg').props.width,300);
  let points=all(tree).filter(n=>n.type==='Point');assert.deepEqual(points.map(n=>n.props.cx),[8,292]);
  points[1].props.onPress();tree=draw(data);
  assert.ok(all(tree).some(n=>n.type==='Text'&&n.props.children==='30'));
  tree.props.onLayout({nativeEvent:{layout:{width:650}}});tree=draw(data);
  points=all(tree).filter(n=>n.type==='Point');assert.deepEqual(points.map(n=>n.props.cx),[8,642]);
  assert.equal(points[1].props.accessibilityLabel,'Tue, Donations: 30');
});
test('empty, zero-value and single-point charts keep finite geometry in a narrow container',()=>{
  for(const data of [[],[{day:'Mon',amount:0}],[{day:'Mon',amount:50}]]){
    states=[];let tree=draw(data);tree.props.onLayout({nativeEvent:{layout:{width:180}}});tree=draw(data);
    for(const point of all(tree).filter(n=>n.type==='Point')){assert.equal(point.props.cx,90);assert.ok(Number.isFinite(point.props.cy));}
    const path=all(tree).find(n=>n.type==='Path').props.d;assert.doesNotMatch(path,/NaN|Infinity/);
    if(!data.length||data[0].amount===0)assert.ok(all(tree).some(n=>n.type==='Text'&&n.props.children==='No data available'));
  }
});
let sheetWidth=1024,snaps=[],shared=[];
const sheetRef={current:{snapToIndex:index=>snaps.push(index),close(){}}};
const {default:ShareRide}=loadTypeScript('app/(app)/carpool/bottomSheets/ShareRideLinkBS.tsx',{
  react:{...React,useMemo:fn=>fn(),useRef:()=>sheetRef,useImperativeHandle:(ref,factory)=>{ref.current=factory();}},
  'react-native':{View:'View',Text:'Text',TouchableOpacity:'Button',Share:{share:async payload=>shared.push(payload)}},
  '@gorhom/bottom-sheet':{default:'Sheet',BottomSheetScrollView:'ScrollView',BottomSheetBackdrop:'Backdrop'},
  'lucide-react-native':{Share2:'Icon'},'@/hooks/useAppTheme':{useAppTheme:()=>({tw,color:value=>value})},
  '@/hooks/useResponsiveLayout':{useResponsiveLayout:()=>({availableWidth:sheetWidth,insets:{top:24}})},
  '@/utils/shareLinks':{buildCarpoolShareLink:id=>'https://gathergo.events/carpool/'+id},
});
test('share ride opens its valid snap position, centers on tablets, and preserves native sharing',async()=>{
  for(sheetWidth of [390,1024]){
    const ref={};const tree=ShareRide.render({carpoolId:'ride-1'},ref);ref.current.open();
    assert.equal(snaps.at(-1),0);assert.ok(snaps.at(-1)<tree.props.snapPoints.length);
    assert.equal(tree.props.containerStyle.marginHorizontal,sheetWidth===390?0:172);
    assert.equal(tree.props.backdropComponent({}).props.disappearsOnIndex,-1);
    await all(tree).find(n=>n.type==='Button').props.onPress();
    assert.match(shared.at(-1).message,/https:\/\/gathergo.events\/carpool\/ride-1/);
  }
});
