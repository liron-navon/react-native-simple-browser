import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Browser from './Browser';

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Embedded browser!</Text>
        </View>

        <View style={styles.browser}>
          <Browser/>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  browser: {
    flex: 1,
    flexDirection: 'row'
  },
  header: {
    height: 65,
    paddingTop: 25,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 20
  },
  root: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
});
