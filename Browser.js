import React, {Component} from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Keyboard,
    Image,
    TouchableHighlight,
    ActivityIndicator
} from "react-native";
import {WebView} from "react-native-webview";
import arrowBackIcon from './assets/arrow_back.png';
import arrowNextIcon from './assets/arrow_next.png';
import webIcon from './assets/web.png';
import refreshIcon from './assets/refresh_page.png';
import incognitoIcon from './assets/incognito.png';

// keeps the reference to the browser
let browserRef = null;

// initial url for the browser
const url = 'http://www.google.com';

// functions to search using different engines
const searchEngines = {
    'google': (uri) => `https://www.google.com/search?q=${uri}`,
    'duckduckgo': (uri) => `https://duckduckgo.com/?q=${uri}`,
    'bing': (uri) => `https://www.bing.com/search?q=${uri}`
};

// upgrade the url to make it easier for the user:
//
// https://www.facebook.com => https://www.facebook.com
// facebook.com => https://www.facebook.com
// facebook => https://www.google.com/search?q=facebook
function upgradeURL(uri, searchEngine = 'google') {
    const isURL = uri.split(' ').length === 1 && uri.includes('.');
    if (isURL) {
        if (!uri.startsWith('http')) {
            return 'https://www.' + uri;
        }
        return uri;
    }
    // search for the text in the search engine
    const encodedURI = encodeURI(uri);
    return searchEngines[searchEngine](encodedURI);
}

// javascript to inject into the window
const injectedJavaScript = `
      window.ReactNativeWebView.postMessage('injected javascript works!');
      true; // note: this is required, or you'll sometimes get silent failures   
`;

class Browser extends Component {
    state = {
        currentURL: url,
        urlText: url,
        title: '',
        canGoForward: false,
        canGoBack: false,
        incognito: false,
        // change configurations so the user can
        // better control the browser
        config: {
            detectorTypes: 'all',
            allowStorage: true,
            allowJavascript: true,
            allowCookies: true,
            allowLocation: true,
            allowCaching: true,
            defaultSearchEngine: 'google'
        }
    };


    // get the configuration, this allows us to change
    // configurations for incognito mode
    get config() {
        const {incognito, config} = this.state;
        if (incognito) {
            return {
                ...config,
                allowStorage: false,
                allowCookies: false,
                allowLocation: false,
                allowCaching: false,
            }
        }
        return config;
    }

    // toggle incognito mode
    toggleIncognito = () => {
        this.setState({
            incognito: !this.state.incognito
        });
        this.reload()
    };

    // load the url from the text input
    loadURL = () => {
        const {config, urlText} = this.state;
        const { defaultSearchEngine } = config;
        const newURL = upgradeURL(urlText, defaultSearchEngine);

        this.setState({
            currentURL: newURL,
            urlText: newURL
        });
        Keyboard.dismiss();
    };

    // update the text input
    updateUrlText = (text) => {
        this.setState({
            urlText: text
        });
    };


    // go to the next page
    goForward = () => {
        if (browserRef && this.state.canGoForward) {
            browserRef.goForward();
        }
    };

    // go back to the last page
    goBack = () => {
        if (browserRef && this.state.canGoBack) {
            browserRef.goBack();
        }
    };

    // reload the page
    reload = () => {
        if (browserRef) {
            browserRef.reload();
        }
    };

    // set the reference for the browser
    setBrowserRef = (browser) => {
        if (!browserRef) {
            browserRef = browser
        }
    };

    // called when there is an error in the browser
    onBrowserError = (syntheticEvent) => {
        const {nativeEvent} = syntheticEvent;
        console.warn('WebView error: ', nativeEvent)
    };

    // called when the webview is loaded
    onBrowserLoad = (syntheticEvent) => {
        const {canGoForward, canGoBack, title} = syntheticEvent.nativeEvent;
        this.setState({
            canGoForward,
            canGoBack,
            title
        })
    };

    // called when the navigation state changes (page load)
    onNavigationStateChange = (navState) => {
        const {canGoForward, canGoBack, title} = navState;
        this.setState({
            canGoForward,
            canGoBack,
            title
        })
    };

    // can prevent requests from fulfilling, good to log requests
    // or filter ads and adult content.
    filterRequest = (request) => {
        return true;
    };

    // called when the browser sends a message using "window.ReactNativeWebView.postMessage"
    onBrowserMessage = (event) => {
        console.log('*'.repeat(10));
        console.log('Got message from the browser:', event.nativeEvent.data);
        console.log('*'.repeat(10));
    };

    render() {
        const {config, state} = this;
        const {currentURL, urlText, canGoForward, canGoBack, title, incognito} = state;
        return (
            <View style={styles.root}>
                <View style={styles.browserTitleContainer}>
                    <Text style={styles.browserTitle}>
                        {title}
                    </Text>
                </View>

                <View style={styles.browserBar}>
                    <TextInput
                        style={styles.browserAddressBar}
                        onChangeText={this.updateUrlText}
                        value={urlText}
                    />

                    <TouchableHighlight onPress={this.loadURL}>
                        <Image
                            style={styles.icon}
                            source={webIcon}/>
                    </TouchableHighlight>

                    <TouchableHighlight onPress={this.goBack}>
                        <Image
                            style={[styles.icon, canGoBack ? {} : styles.disabled]}
                            source={arrowBackIcon}/>
                    </TouchableHighlight>

                    <TouchableHighlight onPress={this.goForward}>
                        <Image
                            style={[styles.icon, canGoForward ? {} : styles.disabled]}
                            source={arrowNextIcon}/>
                    </TouchableHighlight>

                    <TouchableHighlight onPress={this.reload}>
                        <Image
                            style={styles.icon}
                            source={refreshIcon}/>
                    </TouchableHighlight>

                    <TouchableHighlight onPress={this.toggleIncognito}>
                        <Image
                            style={[styles.icon, incognito ? {} : styles.disabled]}
                            source={incognitoIcon}/>
                    </TouchableHighlight>
                </View>
                <View style={styles.browserContainer}>

                    <WebView
                        ref={this.setBrowserRef}
                        originWhitelist={['*']}
                        source={{uri: currentURL}}
                        onLoad={this.onBrowserLoad}
                        onError={this.onBrowserError}
                        onNavigationStateChange={this.onNavigationStateChange}
                        renderLoading={() => <ActivityIndicator size="large" color="#0000ff" /> }
                        onShouldStartLoadWithRequest={this.filterRequest}
                        onMessage={this.onBrowserMessage}
                        dataDetectorTypes={config.detectorTypes}
                        thirdPartyCookiesEnabled={config.allowCookies}
                        domStorageEnabled={config.allowStorage}
                        javaScriptEnabled={config.allowJavascript}
                        geolocationEnabled={config.allowLocation}
                        cacheEnabled={config.allowCaching}
                        injectedJavaScript={injectedJavaScript}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    browser: {
        flex: 1
    },
    root: {
        flex: 1,
        backgroundColor: 'skyblue'
    },
    icon: {
        width: 30,
        height: 30,
        resizeMode: 'contain'
    },
    disabled: {
        opacity: 0.3
    },
    browserTitleContainer: {
      height: 30,
      justifyContent: 'center',
      paddingLeft: 8
    },
    browserTitle: {
        fontWeight: 'bold'
    },
    browserBar: {
        height: 40,
        backgroundColor: 'steelblue',
        flexDirection: 'row',
        alignItems: 'center'
    },
    browserAddressBar: {
        height: 40,
        backgroundColor: 'white',
        borderRadius: 3,
        flex: 1,
        borderWidth: 0,
        marginRight: 8,
        paddingLeft: 8
    },
    browserContainer: {
        flex: 2
    }
});

export default Browser;
