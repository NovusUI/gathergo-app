// components/GoogleWebView.tsx
import { AUTH_URLS } from '@/services/urls';
import { X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

interface GoogleWebViewProps {
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

const GoogleWebView: React.FC<GoogleWebViewProps> = ({ onSuccess, onError, onClose }) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    
    // Check if this is the redirect URL (where backend returns JSON)
    if (url.includes('/auth/google/redirect')) {
      // Inject JavaScript to extract the JSON response
      const injectScript = `
        (function() {
          // Try to find JSON response in the page
          const preElements = document.getElementsByTagName('pre');
          if (preElements.length > 0) {
            try {
              const jsonData = JSON.parse(preElements[0].textContent);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_RESPONSE',
                data: jsonData
              }));
            } catch (e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                error: 'Failed to parse response'
              }));
            }
          } else {
            // Look for JSON in the body
            const bodyText = document.body.textContent;
            try {
              const jsonData = JSON.parse(bodyText);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_RESPONSE',
                data: jsonData
              }));
            } catch (e) {
              // If no JSON found, it might be a regular page
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAGE_LOADED'
              }));
            }
          }
        })();
      `;

      setTimeout(() => {
        webViewRef.current?.injectJavaScript(injectScript);
      }, 1000);
    }
    
    setLoading(navState.loading);
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'AUTH_RESPONSE' && message.data) {
        if (message.data.accessToken) {
          onSuccess(message.data.accessToken);
        } else if (message.data.error) {
          onError(message.data.error);
        }
      } else if (message.type === 'ERROR') {
        onError(message.error);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X color="#000" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Sign in with Google</Text>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: AUTH_URLS.googleLogin }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        startInLoadingState={true}
        style={styles.webview}
        injectedJavaScript={`
          // Base script to detect when page is ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAGE_LOADED'
          }));
          true;
        `}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  webview: {
    flex: 1,
  },
});

export default GoogleWebView;