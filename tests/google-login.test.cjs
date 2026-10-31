const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const React = require('react');
const { Buffer } = require('node:buffer');
const { loadTypeScript } = require('./loadTypeScript.cjs');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
let writes={},userWrite,tokenWrites={},browser,opened=[],errors=[],user=null,pathname='/login',local=[],cursor=0,phaseEffect,cleanup;
const {useAuthStore:store}=loadTypeScript('store/auth.ts',{'@/services/sessionQueryCache':{clearSessionQueryCache:async()=>{}},'@/utils/storage':{removeItem:async()=>{}},'@react-native-async-storage/async-storage':{default:{
  getItem:async()=>null,setItem:async(key,value)=>{if(tokenWrites[key])await tokenWrites[key].promise;writes[key]=value;},multiRemove:async()=>{},
}}});
const useAuthStore=Object.assign(()=>store.getState(),{getState:store.getState});
const auth={useAuth:()=>({user,loading:false,setUser:value=>{user=value;}})};
const tw=()=>({});tw.style=()=>({});
const theme={useAppTheme:()=>({tw,color:value=>value})};
const native=Object.fromEntries(['View','Text','TouchableOpacity','KeyboardAvoidingView','ScrollView'].map(name=>[name,name]));native.Platform={OS:'ios'};native.Keyboard={addListener:()=>({remove(){}})};native.StyleSheet={absoluteFillObject:{position:'absolute'}};
const {default:Login}=loadTypeScript('app/(auth)/login/index.tsx',{
  '@/hooks/useAppTheme':theme,'@/context/AuthContext':auth,'@/store/auth':{useAuthStore},'@/services/mutations':{useLogin:()=>({mutate(){},isPending:false})},
  '@/constants/network':{GOOGLE_AUTH_URL:'https://api.gathergo.test/auth/google'},
  '@/utils/globalErrorHandler':{showGlobalError:message=>errors.push(message),showGlobalSuccess(){},showGlobalWarning(){}},
  '@/utils/navigation':{useLockedRouter:()=>({push(){},replace(){}})},
  '@/utils/storage':{getItem:async()=>null,removeItem:async()=>{},saveItem:async(key,value)=>{if(userWrite)await userWrite.promise;writes[key]=value;}},
  'expo-linking':{createURL:()=> 'gathergoapp://login',parse:url=>({queryParams:Object.fromEntries(new URL(url).searchParams)})},
  'expo-web-browser':{openAuthSessionAsync:(...args)=>{opened.push(args);return browser.promise;}},
  react:{...React,useEffect(){},useRef:()=>({current:null}),useState:initial=>{const i=cursor++;if(!(i in local))local[i]=initial;return[local[i],value=>{local[i]=value;}];}},
  'react-native':native,'react-hook-form':{Controller:'Controller',useForm:()=>({control:{},handleSubmit:fn=>fn,setValue(){},formState:{errors:{}}})},
  '@hookform/resolvers/zod':{zodResolver:()=>{}},'lucide-react-native':{Key:'Icon',Mail:'Icon',XIcon:'Icon'},
  ...Object.fromEntries(['CustomSwitcher','buttons/CustomBtn1','buttons/GoogleLoginBtn','inputs/CustomInput1','ui/LocalSvgAsset'].map(name=>['@/components/'+name,{default:name==='buttons/GoogleLoginBtn'?'GoogleButton':'Component'}])),
});
const {default:Root}=loadTypeScript('navigators/RootNavigators.tsx',{'@/utils/incomingShareRoute':{incomingShareRoute:()=>null},'@/context/SessionProvider':{default:'SessionProvider'},
  '@/hooks/useAppTheme':theme,'@/context/AuthContext':auth,'@/store/auth':{useAuthStore},react:{useState:()=>[null,()=>{}],useEffect:effect=>{phaseEffect=effect;}},'react-native':native,
  '@/components/ui/AppLaunchScreen':{default:'LaunchScreen'},'@/components/ui/FullScreenLoader':{default:'GoogleLoader'},
  'expo-linking':{},'expo-router':{Stack:Object.assign(function Stack(){},{Screen:'Screen'}),usePathname:()=>pathname,useRootNavigationState:()=>({key:'root'}),useRouter:()=>({replace(){}})},
});
const {default:AuthLayout}=loadTypeScript('app/(auth)/_layout.tsx',{
  '@/hooks/useAppTheme':theme,'@/context/AuthContext':auth,'@/store/auth':{useAuthStore},'@/components/ui/FullScreenLoader':{default:'Loader'},'expo-router':{Stack:'Stack',Redirect:'Redirect'},
});
let frames=new Map(),frameId=0;
const originalRAF=global.requestAnimationFrame,originalCancelRAF=global.cancelAnimationFrame;
global.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};global.cancelAnimationFrame=id=>frames.delete(id);
after(()=>{global.requestAnimationFrame=originalRAF;global.cancelAnimationFrame=originalCancelRAF;});
function* nodes(tree){if(!tree||typeof tree!=='object')return;yield tree;for(const child of [tree.props?.children].flat(Infinity))yield* nodes(child);}
function renderRoot(){cleanup?.();phaseEffect=undefined;const tree=Root();cleanup=phaseEffect?.();return tree;}
function masked(){const tree=renderRoot();const loader=[...nodes(tree)].find(n=>n.type==='GoogleLoader');if(loader)assert.ok([...nodes(tree)].some(n=>n.props.importantForAccessibility==='no-hide-descendants'));return Boolean(loader);}
function paint(){const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());}
function reset(){cleanup?.();cleanup=undefined;writes={};tokenWrites={};userWrite=undefined;browser=deferred();opened=[];errors=[];user=null;pathname='/login';local=[];cursor=0;frames.clear();store.setState({token:null,refreshToken:null,isAuthenticated:false,hasHydrated:true,googleAuthPhase:'idle'});}
function button(){cursor=0;return [...nodes(Login())].find(n=>n.type==='GoogleButton');}
const jwt=claims=>Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:'user-1',email:'ada@example.com',username:'ada',...claims})).toString('base64url')+'.signature';
function returned(claims){return{type:'success',url:'gathergoapp://login?token='+jwt(claims)+'&refreshToken=refresh-1'};}
test('Google handoff remains covered during callback remounts and all user/token storage writes, then reveals Explore',async()=>{
  reset();userWrite=deferred();tokenWrites.access_token=deferred();tokenWrites.refresh_token=deferred();
  const oldButton=button(),login=oldButton.props.onPress();assert.equal(masked(),true);assert.equal(store.getState().googleAuthPhase,'opening');
  await oldButton.props.onPress();assert.equal(opened.length,1,'repeated taps cannot open two browser sessions');
  local=[];cursor=0;assert.equal(button().props.disabled,true,'callback route remount retains the shared sign-in phase');
  pathname='/onboarding';assert.equal(masked(),true);
  browser.resolve(returned({isProfileComplete:true,hasPreferences:true}));await flush();assert.equal(store.getState().googleAuthPhase,'completing');assert.equal(store.getState().isAuthenticated,false);assert.equal(masked(),true);
  userWrite.resolve();await flush();assert.equal(store.getState().isAuthenticated,false);assert.equal(masked(),true);
  tokenWrites.access_token.resolve();await flush();assert.equal(store.getState().isAuthenticated,false);assert.equal(masked(),true);
  tokenWrites.refresh_token.resolve();await login;assert.equal(store.getState().isAuthenticated,true);assert.equal(masked(),true,'onboarding remains covered after token commit');
  pathname='/login';assert.equal(AuthLayout().props.href,'/');assert.equal(masked(),true);
  pathname='/';assert.equal(masked(),true,'destination stays covered until its render frame');paint();assert.equal(masked(),false);
  assert.equal(store.getState().googleAuthPhase,'idle');assert.equal(writes.refresh_token,'refresh-1');
  assert.equal(JSON.parse(writes.user).isProfileComplete,true);
  assert.equal(Object.hasOwn(JSON.parse(writes['auth-storage']).state,'googleAuthPhase'),false,'transient handoff state is never restored after a restart');
});
test('new users go straight to profile completion and complete profiles without preferences go straight to mapping',async()=>{
  for(const [isProfileComplete,hasPreferences,destination] of [[false,false,'/profile-setup'],[true,false,'/preference']]){
    reset();const login=button().props.onPress();browser.resolve(returned({isProfileComplete,hasPreferences}));await login;
    assert.equal(AuthLayout().props.href,destination);assert.equal(masked(),true);pathname='/';assert.equal(masked(),true);
    pathname=destination;assert.equal(masked(),true);paint();assert.equal(masked(),false);
  }
});
test('a route change before the ready frame keeps the handoff covered',async()=>{
  reset();const login=button().props.onPress();browser.resolve(returned({isProfileComplete:true,hasPreferences:true}));await login;
  pathname='/';masked();pathname='/login';masked();paint();assert.equal(store.getState().googleAuthPhase,'completing');assert.equal(masked(),true);
  pathname='/';masked();paint();assert.equal(masked(),false);
});
test('cancellation, missing tokens and invalid tokens release the overlay and allow retry without authenticating',async()=>{
  for(const result of [{type:'cancel'},{type:'dismiss'},{type:'success',url:'gathergoapp://login?token=missing-refresh'},{type:'success',url:'gathergoapp://login?token=invalid&refreshToken=refresh'}]){
    reset();const login=button().props.onPress();browser.resolve(result);await login;assert.equal(masked(),false);assert.equal(store.getState().isAuthenticated,false);assert.equal(button().props.disabled,false);
    assert.equal(errors.length,['cancel','dismiss'].includes(result.type)?0:1);
  }
});
test('a failed session write returns to login and logout clears any in-flight handoff',async()=>{
  reset();userWrite=deferred();const login=button().props.onPress();browser.resolve(returned({isProfileComplete:true,hasPreferences:true}));await flush();userWrite.reject(new Error('Storage unavailable'));await login;
  assert.equal(store.getState().isAuthenticated,false);assert.equal(masked(),false);assert.equal(errors.length,1);
  store.getState().setGoogleAuthPhase('opening');await store.getState().logout();assert.equal(store.getState().googleAuthPhase,'idle');
});
