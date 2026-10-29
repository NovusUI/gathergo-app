const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const { default: create } = require('twrnc/create');
const { getAdaptiveLayout } = loadTypeScript('utils/layout.ts');
const { getAppTheme } = loadTypeScript('utils/theme/index.ts', { twrnc: { create: config => create(config, 'ios') } });
let mode = 'light', width = 390, fontScale = 1;
const layout = () => ({...getAdaptiveLayout(width, 844, fontScale, false), fontScale, insets: {top: 59, bottom: 34, left: 0, right: 0}});
let state = [], cursor = 0;
const navigations=[];
const hooks = {...React, useEffect() {}, useCallback: fn => fn, useMemo: fn => fn(),
  useState(initial) {const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},
  useRef(initial) {const [ref]=hooks.useState({current:initial});return ref;},
};
const native = Object.fromEntries(['View','Text','TouchableOpacity','ScrollView','FlatList','Modal','TextInput','KeyboardAvoidingView'].map(name=>[name,name]));
native.Platform={OS:'ios'};
const common = {
  react: hooks, 'react-native': native, 'react-native-safe-area-context': {SafeAreaView:'SafeArea'},
  '@/hooks/useAppTheme': {useAppTheme:()=>getAppTheme(mode)},
  '@/hooks/useResponsiveLayout': {useResponsiveLayout:layout},
  '@/components/CustomeTopBarNav': {default:'Nav'}, '@/components/View': {default:'Card'},
  '@/components/buttons/CustomBtn1': {default:'Button'}, '@/components/ui/ImpactPageLoader': {default:'Loading'},
  '@/components/ui/GogoRefreshScrollView': {default:'RefreshScrollView',RefreshIndicator:'RefreshIndicator'},
  '@/utils/navigation': {useLockedRouter:()=>({replace:path=>navigations.push(path),push() {}}),safeGoBack() {}},
};
function* nodes(node) {if(!node||typeof node!=='object')return;yield node;for(const child of [node.props?.children].flat(Infinity))yield* nodes(child);}
const all = tree => [...nodes(tree)];
const has = (tree,type) => all(tree).some(node=>node.type===type);
const flatten = styles => Object.assign({},...[styles].flat(Infinity).filter(Boolean));
function screen(Component,reset=true) {if(reset)state=[];cursor=0;return Component();}
const {default:DashboardLayout}=loadTypeScript('components/dashboard/DashboardLayout.tsx',{
  ...common, '@/components/Shortcut': {default:'Shortcut'},
});
test('Dashboard keeps Quick Access below the scroll area and changes columns as its safe width changes',()=>{
  for(const [size,scale,direction] of [[320,1,'column'],[700,1,'column'],[1024,1,'row'],[1366,1.6,'column']]) {
    width=size;fontScale=scale;
    const tree=DashboardLayout({title:'Dashboard',onBack(){},shortcuts:[{id:'wallet',title:'Wallet',link:'wallet',iconColor:'#FF932E'}],children:React.createElement('Events'),secondary:React.createElement('Payments')});
    const scroll=all(tree).find(n=>n.type==='ScrollView'&&!n.props.horizontal);
    assert.ok(has(scroll,'Events'));assert.ok(has(scroll,'Payments'));assert.equal(has(scroll,'Shortcut'),false);
    assert.ok(all(scroll).some(n=>n.type==='View'&&n.props.style?.flexDirection===direction));
    const access=all(tree).find(n=>n.type==='View'&&has(n,'Shortcut')&&!has(n,'Events'));
    assert.notEqual(flatten(access.props.style).position,'absolute');
    assert.equal(tree.props.edges.includes('top'),true);
  }
  const loading=DashboardLayout({title:'Dashboard',onBack(){},shortcuts:[],loading:React.createElement('Loading')});
  assert.ok(has(loading,'Loading'));assert.equal(has(loading,'ScrollView'),false);
});
let owner=false, passengerStatus='ACCEPTED', requestHistory=null, rideError=null, visitingUserId=null;
let refreshRide=async()=>{};
const rideErrors=[];
const carpool={id:'ride-1',status:'ACTIVE',origin:'Library gate',destination:'Community garden',departureTime:'09:00',availableSeats:3,seatsLeft:2,pricePerSeat:0,description:'Shared ride',vehicleIcon:'city_car',note:'Meet at the main gate',driver:{id:'driver',username:'Pooler',profilePicUrlTN:null},event:{id:'event',title:'Community morning',location:'Community garden',startDate:'2035-01-01T10:00:00Z',endDate:'2035-01-01T14:00:00Z'},passengers:[{id:'rider-1',userId:'rider',requestedAt:'2035-01-01T08:00:00Z',status:'ACCEPTED',user:{id:'rider'}}]};
const {default:Carpool}=loadTypeScript('app/(app)/carpool/[id].tsx',{
  ...common, '@/context/AuthContext': {useAuth:()=>({user:{id:visitingUserId??(owner?'driver':'rider')}})},
  '@/context/SocketContext': {useSocket:()=>({socket:null})},
  '@/services/queries': {useGetCarpoolDetails:()=>({data:{data:{...carpool,passengers:requestHistory??[{...carpool.passengers[0],status:passengerStatus}]}},error:rideError,isPending:false,refetch:(...args)=>refreshRide(...args)})},
  '@/services/mutations': Object.fromEntries(['useLeaveCarpool','useFollowUser','useRequestCarpoolAfterCancel'].map(name=>[name,()=>({isPending:false,mutateAsync(){}})])),
  '@/utils/dateTimeHandler': {isEventPastEnd:()=>false}, '@/utils/utils': {formatTo12Hour:value=>value},
  '@/utils/globalErrorHandler': {showGlobalError:message=>rideErrors.push(message),showGlobalSuccess(){},showGlobalWarning(){}},
  '@expo/vector-icons': {Ionicons:'Icon'}, 'lucide-react-native': {MessagesSquareIcon:'Icon'},
  '@tanstack/react-query': {useQueryClient:()=>({invalidateQueries(){}})},
  'expo-router': {useLocalSearchParams:()=>({id:'ride-1'})}, 'react-native-gesture-handler': {ScrollView:'GestureScrollView'},
  '@/components/AvatarGroup': {default:'Crew'}, '@/components/AvatarWithLabel': {default:'Driver'}, '@/components/PoolingWithA': {default:'RideVibe'},
  './CancelCarpoolModal': {default:'CancelModal'}, ...Object.fromEntries(['EditRideBS','FlexrideBS','SendRequestBS','ShareRideLinkBS','ViewRequestBS'].map(name=>['./bottomSheets/'+name,{default:name}])),
});
test('Carpool keeps the phone action outside the main scroller and moves crew and actions into the tablet sidebar',()=>{
  fontScale=1;
  for(width of [320,700,1024]) {
    for(owner of [false,true]) {
      const tree=screen(Carpool),scrolls=all(tree).filter(n=>['RefreshScrollView','ScrollView'].includes(n.type));
      assert.equal(scrolls.length,width>=960?2:1);
      const main=scrolls[0];assert.ok(has(main,'RideVibe'));
      assert.equal(has(main,'Driver'),width<960);assert.equal(has(main,'Crew'),width<960);
      assert.equal(has(main,'Button'),false);
      const action=all(tree).find(n=>n.type==='Button');assert.equal(action.props.title,owner?'View Requests':'Leave Ride');
      if(width>=960){assert.ok(has(scrolls[1],'Driver'));assert.ok(has(scrolls[1],'Crew'));assert.ok(has(scrolls[1],'Button'));}
    }
  }
  owner=false;passengerStatus='PENDING';width=390;
  const action=all(screen(Carpool)).find(n=>n.type==='Button');assert.equal(action.props.title,'Request Pending');assert.equal(action.props.disabled,true);
});
test('only the pooler and accepted riders see one inline chat button, including after scrolling',()=>{
  fontScale=1;navigations.length=0;
  try {
    for(width of [320,700,1024]) {
      for(const entry of [
        {owner:true,status:'PENDING',member:true},
        {owner:false,status:'ACCEPTED',member:true},
        ...['PENDING','DECLINED','REMOVED','LEFT'].map(status=>({owner:false,status,member:false})),
        {owner:false,status:'ACCEPTED',visitor:'visitor',member:false},
      ]) {
        owner=entry.owner;passengerStatus=entry.status;visitingUserId=entry.visitor??null;
        const tree=screen(Carpool);
        const main=all(tree).find(n=>['RefreshScrollView','ScrollView','GestureScrollView'].includes(n.type));
        main.props.onLayout?.({nativeEvent:{layout:{height:480}}});
        const anchor=all(tree).find(n=>n.type==='View'&&n.props.onLayout&&has(n,'Crew'));
        anchor?.props.onLayout({nativeEvent:{layout:{y:100,height:80}}});
        main.props.onScroll?.({nativeEvent:{contentOffset:{y:600},layoutMeasurement:{height:480}}});
        const next=screen(Carpool,false);
        const buttons=all(next).filter(n=>n.props.accessibilityLabel==='Open carpool chat');
        assert.equal(buttons.length,entry.member?1:0,`${width}: ${entry.owner?'pooler':entry.visitor??entry.status}`);
        if(entry.member) {
          assert.notEqual(flatten(buttons[0].props.style).position,'absolute');
          const crewCard=all(next).find(n=>n.type==='View'&&has(n,'Crew')&&all(n).includes(buttons[0]));
          assert.ok(crewCard);
          buttons[0].props.onPress();assert.equal(navigations.at(-1),'/chat/ride-1');
        }
      }
    }
  } finally {owner=false;passengerStatus='ACCEPTED';visitingUserId=null;}
});
test('a declined rider can retry, removal blocks another request, and a new pending attempt keeps its prior outcome visible',()=>{
  owner=false;width=390;fontScale=1;
  try {
    for(const [status,title,disabled] of [['DECLINED','Request again',false],['REMOVED','Removed from ride',true]]) {
      passengerStatus=status;
      const tree=screen(Carpool),action=all(tree).find(n=>n.type==='Button');
      assert.equal(action.props.title,title);assert.equal(action.props.disabled,disabled);
      assert.ok(all(tree).some(n=>n.type==='Text'&&n.props.children===(status==='DECLINED'?'Previously declined':'Previously removed')));
    }
    requestHistory=[{...carpool.passengers[0],status:'DECLINED'},{...carpool.passengers[0],id:'retry',status:'PENDING',requestedAt:'2035-01-01T08:30:00Z'}];
    const tree=screen(Carpool);
    assert.equal(all(tree).find(n=>n.type==='Button').props.title,'Request Pending');
    assert.ok(all(tree).some(n=>n.type==='Text'&&n.props.children==='Previously declined'));
  } finally {requestHistory=null;passengerStatus='ACCEPTED';}
});
test('carpool pull-to-refresh waits for the query and uses one indicator on phones and tablets',async()=>{
  owner=false;fontScale=1;
  for(width of [390,1024]) {
    let finish;refreshRide=options=>{assert.equal(options.throwOnError,true);return new Promise(resolve=>{finish=resolve;});};
    const tree=screen(Carpool),main=all(tree).find(n=>n.type==='RefreshScrollView');
    assert.equal(has(tree,'GestureScrollView'),false);
    assert.equal(flatten(main.props.contentContainerStyle).flexGrow,1,'short content still fills the refreshable viewport');
    const pending=main.props.onRefresh();
    let next=screen(Carpool,false);
    assert.equal(all(next).find(n=>n.type==='RefreshScrollView').props.refreshing,true);
    assert.equal(all(next).filter(n=>n.type==='RefreshScrollView').length,1);
    finish();await pending;next=screen(Carpool,false);
    assert.equal(all(next).find(n=>n.type==='RefreshScrollView').props.refreshing,false);
  }
  refreshRide=async()=>{};
});
test('refreshing a removed rider’s membership hides chat and updates the ride action',async()=>{
  owner=false;width=390;passengerStatus='ACCEPTED';
  refreshRide=async()=>{passengerStatus='REMOVED';};
  try {
    const tree=screen(Carpool);
    assert.equal(all(tree).filter(n=>n.props.accessibilityLabel==='Open carpool chat').length,1);
    await all(tree).find(n=>n.type==='RefreshScrollView').props.onRefresh();
    const next=screen(Carpool,false);
    assert.equal(all(next).filter(n=>n.props.accessibilityLabel==='Open carpool chat').length,0);
    assert.equal(all(next).find(n=>n.type==='Button').props.title,'Removed from ride');
  } finally {passengerStatus='ACCEPTED';refreshRide=async()=>{};}
});
test('a failed carpool refresh preserves the loaded ride and clears the refreshing state',async()=>{
  width=390;owner=false;rideErrors.length=0;
  refreshRide=async()=>{rideError=Error('offline');throw rideError;};
  try {
    const tree=screen(Carpool),refresh=all(tree).find(n=>n.type==='RefreshScrollView');
    await refresh.props.onRefresh();
    const next=screen(Carpool,false);
    assert.ok(has(next,'RideVibe'));
    assert.equal(all(next).find(n=>n.type==='RefreshScrollView').props.refreshing,false);
    assert.deepEqual(rideErrors,["Couldn't refresh this ride. Try again."]);
  } finally {rideError=null;refreshRide=async()=>{};}
});
const response=data=>({data:{data},isPending:false,isLoading:false,isError:false,refetch:async()=>{}});
const walletQueries={
  useWalletOverview:()=>response({balance:{totalCollected:10000,availableBalance:6000,heldBalance:2000,processingBalance:1000,settledBalance:1000},payoutProfile:null,recentTransactions:[],recentSettlements:[]}),
  useWalletOnboarding:()=>response({needsAttention:false,showPersistentAlert:false,nextAction:null,canReceiveSettlement:true,tasks:[],kycTier:'BASIC',livenessRequired:false}),
  useWalletKyc:()=>response({status:'NOT_STARTED',steps:[],currentStep:'PAYOUT_ACCOUNT'}),useWalletBanks:()=>response([]),
  useWalletTransactions:()=>({data:{pages:[]}}),useWalletSettlements:()=>({data:{pages:[]}}),
};
const {default:Wallet}=loadTypeScript('app/(app)/wallet/index.tsx',{
  ...common, '@/context/AuthContext': {useAuth:()=>({user:{id:'rider'}})}, '@/services/queries':walletQueries,
  '@/services/mutations':Object.fromEntries(['useResolveWalletPayoutAccount','useStartBusinessKyc','useStartBusinessRepresentativeKyc','useStartPersonalKyc','useSubmitWalletLiveness','useUpsertWalletPayoutProfile'].map(name=>[name,()=>({isPending:false})])),
  '@/components/ui/GogoRefreshScrollView': {default:'RefreshScrollView',RefreshIndicator:'RefreshIndicator'}, '@/components/ui/AppLoader':{default:'Spinner'},'@/components/ui/AppToast':{default:'Toast'},
  '@/components/gogo/mascot/GatherGoMascot':{GatherGoMascot:'Gogo'},'@/components/gogo/mascot/MascotMoment':{MascotMoment:'GogoMoment'},
  '@/utils/globalErrorHandler':{showGlobalError(){},showGlobalSuccess(){},showGlobalWarning(){}},
  '@react-native-picker/picker':{Picker:'Picker'},'expo-router':{useFocusEffect(){}},'expo-image-picker':{},'react-native-dropdown-picker':{default:'Dropdown'},
  'lucide-react-native':Object.fromEntries(['CheckCircle2','ChevronRight','CircleDollarSign','Clock3','Loader','Wallet','X'].map(name=>[name,'Icon'])),
});
test('Wallet adapts its sections and balance grid, and setup uses a safe, scrollable modal',()=>{
  for(const [size,scale,direction] of [[320,1,'column'],[700,1,'column'],[1024,1,'row'],[1024,1.6,'column']]) {
    width=size;fontScale=scale;
    const tree=screen(Wallet),main=all(tree).find(n=>n.type==='RefreshScrollView');
    assert.equal(main.props.contentContainerStyle.paddingBottom,24);
    assert.equal(all(main).filter(n=>n.type==='View'&&n.props.style?.flexDirection===direction&&n.props.style?.gap===16).length,2);
    const tiles=all(main).filter(n=>['47%','100%'].includes(flatten(n.props.style).flexBasis));
    assert.equal(tiles.length,4);assert.ok(tiles.every(n=>flatten(n.props.style).flexBasis===(scale>1.4?'100%':'47%')));
    const setup=all(main).find(n=>n.type==='TouchableOpacity'&&all(n).some(c=>c.type==='Text'&&String(c.props.children).includes('Manage')));
    assert.ok(setup);setup.props.onPress();
    const opened=screen(Wallet,false),modal=all(opened).find(n=>n.type==='Modal');assert.equal(modal.props.visible,true);
    const safe=all(modal).find(n=>n.type==='SafeArea');assert.deepEqual(safe.props.edges,['top','left','right','bottom']);
    assert.ok(has(safe,'ScrollView'));
  }
});
