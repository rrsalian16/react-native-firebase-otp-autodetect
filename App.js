/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import RNOtpVerify from 'react-native-otp-verify';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

const CELL_COUNT = 6;

const App = () => {
  const [isOtpView, setIsOtpView] = useState(false);
  const [mobile, setMobile] = useState(null);
  const [otp, setOtp] = useState('');

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const [confirm, setConfirm] = useState(null);

  const ref = useBlurOnFulfill({ value: otp, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    otp,
    setOtp,
  });

  const onAuthStateChanged = user => {
    if (user) {
      setUser(user);
      console.log(user);
    }
    if (initializing) setInitializing(false);
  };

  React.useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  // Handle confirm code button press
  async function confirmCode() {
    console.log(otp);
    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(
        confirm.verificationId,
        otp,
      );
      console.log(credential);
      let userData = await auth().signInWithCredential(credential);
      console.log(userData);
      setUser(userData.user);
      setIsOtpView(false);
      setOtp(null);
    } catch (error) {
      console.log(error);
      setIsOtpView(false);
      setOtp(null);

      if (error.code == 'auth/invalid-verification-code') {
        console.log('Invalid code.');
      } else {
        console.log('Account linking error');
      }
    }
  }

  const onSubmitHandler = async () => {
    Keyboard.dismiss();
    if (!isOtpView && mobile && mobile?.length === 10) {
      console.log('#########', mobile);
      setInitializing(true);
      auth()
        .verifyPhoneNumber('+91' + mobile)
        .on(
          'state_changed',
          phoneAuthSnapshot => {
            console.log('#####start####');
            console.log(phoneAuthSnapshot);
            console.log('#####end####');
            setConfirm(phoneAuthSnapshot);
            if (
              phoneAuthSnapshot.state === firebase.auth.PhoneAuthState.CODE_SENT
            ) {
              console.log('!!!!!!!!!!!!!!!!!');
            } else if (
              phoneAuthSnapshot.state ===
              firebase.auth.PhoneAuthState.AUTO_VERIFIED
            ) {
              setOtp(phoneAuthSnapshot.code);
              setInitializing(false);
              setIsOtpView(true);
            } else if (
              phoneAuthSnapshot.state ===
              firebase.auth.PhoneAuthState.AUTO_VERIFY_TIMEOUT
            ) {
              setIsOtpView(true);
              setInitializing(false);
            } else {
              console.log('$$$$$Error$$$$$$$$');
              console.log(phoneAuthSnapshot);
              setInitializing(false);
            }
          },
          error => {
            console.log(error);
            setInitializing(false);
          },
        );
    } else {
      console.log('!**************');
      if (otp.length === 6) {
        confirmCode();
      }
    }
  };

  const onInputChangeMobile = input => {
    setMobile(input);
  };
  const onInputChangeOtp = input => {
    setOtp(input);
  };

  const logout = () => {
    auth().signOut();
    setUser(null);
    setConfirm(null);
  };

  if (initializing)
    return (
      <ActivityIndicator
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        size="large"
        color="red"
      />
    );

  return (
    <SafeAreaView>
      <StatusBar />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: 'white', height: 1000 }}>
        <Text style={{ textAlign: 'center', margin: 20, fontSize: 20 }}>
          Login Sample
        </Text>

        {!user && (
          <TextInput
            onChangeText={onInputChangeMobile}
            value={mobile}
            keyboardType="numeric"
            placeholder="Phone Number"
            maxLength={10}
            style={{
              borderColor: 'black',
              borderWidth: 1,
              margin: 10,
              color: 'black',
            }}></TextInput>
        )}

        {!user && isOtpView ? (
          <CodeField
            ref={ref}
            {...props}
            value={otp}
            onChangeText={setOtp}
            cellCount={CELL_COUNT}
            rootStyle={styles.codeFieldRoot}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            renderCell={({ index, symbol, isFocused }) => (
              <Text
                key={index}
                style={[styles.cell, isFocused && styles.focusCell]}
                onLayout={getCellOnLayoutHandler(index)}>
                {symbol || (isFocused ? <Cursor /> : null)}
              </Text>
            )}
          />
        ) : null}

        <View
          style={{ flexDirection: 'row', justifyContent: 'center', margin: 10 }}>
          {user ? (
            <View>
              <Button title={'Logout'} onPress={logout}></Button>
            </View>
          ) : (
            <Button
              onPress={onSubmitHandler}
              style={{ width: 20 }}
              title={isOtpView ? 'Login' : 'Otp'}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  borderStyleBase: {
    width: 30,
    height: 45,
  },

  borderStyleHighLighted: {
    borderColor: '#03DAC6',
  },

  underlineStyleBase: {
    width: 30,
    height: 45,
    borderWidth: 0,
    borderBottomWidth: 1,
  },

  underlineStyleHighLighted: {
    borderColor: '#03DAC6',
  },
  root: { flex: 1, padding: 20 },
  title: { textAlign: 'center', fontSize: 30 },
  codeFieldRoot: { margin: 20 },
  cell: {
    width: 40,
    height: 40,
    lineHeight: 38,
    fontSize: 24,
    borderBottomWidth: 2,
    // borderBottomWidth: 2,
    borderColor: '#00000030',
    textAlign: 'center',
  },
  focusCell: {
    borderColor: '#000',
  },
});

export default App;
