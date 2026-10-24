const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { loadTypeScript } = require('./loadTypeScript.cjs');
let expanded=false,paths=[];
const hooks={...React,useState:initial=>typeof initial==='boolean'?[expanded,value=>{expanded=value;}]:[initial,()=>{}],useRef:()=>({current:null}),useMemo:fn=>fn(),useCallback:fn=>fn};
const tw=()=>({});
const navigation={useLockedRouter:()=>({}),pushWithLock:(_router,path)=>paths.push(path)};
const {default:EventsOverview}=loadTypeScript('components/EventsOverview.tsx',{
  react:hooks,'react-native':{View:'View',Text:'Text',TouchableOpacity:'Button',Modal:'Modal',ScrollView:'ScrollView'},'react-native-safe-area-context':{SafeAreaView:'SafeArea'},
  '@/hooks/useAppTheme':{useAppTheme:()=>({tw,color:value=>value})},'@/hooks/usePressGuard':{usePressGuard:fn=>fn},'@/utils/navigation':navigation,
  '@/hooks/useDashboard':{useDashboardEvents:()=>({data:{pages:[{data:[event]}]},isLoading:false,hasNextPage:false})},
  '@/components/ui/AppLoader':{default:'Spinner'},'@/components/ui/ImpactPageLoader':{default:'Loader'},'lucide-react-native':{ChevronDown:'Icon',X:'Icon'},
  './ProgressIndicator':{default:'Progress'},'./View':{default:'Card'},
});
const event={id:'event-1',title:'Community morning',description:'Meet the community.',progress:30,participants:3,raised:10000,goal:30000,date:'Nov 12',type:'upcoming'};
function* nodes(node){if(!node||typeof node!=='object')return;yield node;for(const child of [node.props?.children].flat(Infinity))yield* nodes(child);}
const eventRows=tree=>[...nodes(tree)].filter(n=>n.props?.event?.id===event.id&&typeof n.props.onPress==='function');
test('Dashboard overview rows open the event management detail route',()=>{
  expanded=false;paths=[];const tree=EventsOverview({initialEvents:[event]});
  assert.equal(eventRows(tree).length,1);eventRows(tree)[0].props.onPress();
  assert.deepEqual(paths,['/dashboard/event-1']);assert.equal(expanded,false);
});
test('expanded overview rows close their modal before opening management details',()=>{
  expanded=true;paths=[];const tree=EventsOverview({initialEvents:[event]});
  assert.equal(tree.type,'Modal');eventRows(tree)[0].props.onPress();
  assert.equal(expanded,false);assert.deepEqual(paths,['/dashboard/event-1']);
});
const {default:Shortcut}=loadTypeScript('components/Shortcut.tsx',{
  react:hooks,'react-native':{View:'View',Text:'Text',TouchableOpacity:'Button'},'@/hooks/useAppTheme':{useAppTheme:()=>({tw,color:value=>value})},'@/hooks/usePressGuard':{usePressGuard:fn=>fn},'@/utils/navigation':navigation,
});
test('Quick Access follows the server-provided dashboard detail link and retains Wallet and creation destinations',()=>{
  paths=[];
  for(const link of ['dashboard/event-2','events/event-3','wallet','events/create'])Shortcut({title:'Shortcut',link}).props.onPress();
  assert.deepEqual(paths,['/dashboard/event-2','/dashboard/event-3','/wallet','/new-event']);
});
