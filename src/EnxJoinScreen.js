import React, {useState, useRef} from 'react';
import {
  Platform,
  View,
  StyleSheet,
  Text,
  Alert,
  TouchableHighlight,
  TextInput,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';

// import PropTypes from "prop-types";
import axios from 'axios';
import Logo from './Logo';
import {each} from 'underscore';

function ExJoinScreen() {
  const [user_name, setUser_name] = useState('');
  const [room_id, setRoom_id] = useState('');
  const [permissionsError, setPermissionsError] = useState(false);

  const textInput1Ref = useRef();
  const textInput2Ref = useRef();

  const onJoinRoom = () => {
    if (!user_name && !room_id) {
      Alert.alert('Please enter your details');
    } else if (!user_name) {
      Alert.alert('Please enter your name');
    } else if (!room_id) {
      Alert.alert('Please enter roomId');
    } else {
      navigateToVideo();
    }
  };

  const onCreateRoom = async () => {
    if (Platform.OS === 'android') {
      try {
        await checkAndroidPermissions();
        setPermissionsError(false);
      } catch (error) {
        setPermissionsError(true);
        console.log('checkAndroidPermissions', error);
        return;
      }
    }
    await getRoomIDWebCall();
  };

  const getRoomIDWebCall = async () => {
    const header = kTry ? {'x-app-id': kAppId, 'x-app-key': kAppkey} : {};
    const options = {
      headers: header,
    };

    try {
      const response = await axios.post(kBaseURL + 'createRoom/', {}, options);
      if (response.data.result !== 0) {
        Alert.alert(response.data.desc);
        return;
      } else {
        this.infos = response.data;
        console.log('axiosResponseinfo', this.infos);
      }
    } catch (error) {
      console.log('axiosRoomIdCatchError', error);
    }

    setRoom_id(infos.room.room_id);
  };

  const getRoomTokenWebCall = async () => {
    console.log('vxc', room_id);
    const header = kTry ? {'x-app-id': kAppId, 'x-app-key': kAppkey} : {};
    const options = {
      headers: header,
    };

    try {
      const response = await axios.post(
        kBaseURL + 'createToken/',
        {
          name: user_name,
          role: 'participant',
          user_ref: '2236',
          roomId: room_id,
        },
        options,
      );
      this.res_token = response.data;
      console.log('axiosResponsetoken', this.res_token);
    } catch (error) {
      console.log('axiosCreateTokenCatch', error);
    }
  };

  const navigateToVideo = async () => {
    await getRoomTokenWebCall();
    try {
      if (res_token.result == 0) {
        this.props.navigation.navigate('EnxConferenceScreen', {
          username: user_name,
          token: res_token.token,
        });
      } else {
        Alert.alert(res_token.error);
        console.log(res_token.error);
      }
    } catch (error) {
      console.log('navigationError', error);
    }
  };

  const checkAndroidPermissions = () =>
    new Promise((resolve, reject) => {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ])
        .then(result => {
          const permissionsError = {};
          permissionsError.permissionsDenied = [];
          each(result, (permissionValue, permissionType) => {
            if (permissionValue === 'denied') {
              console.log('denied Permission');
              permissionsError.permissionsDenied.push(permissionType);
              permissionsError.type = 'Permissions error';
            }
          });
          if (permissionsError.permissionsDenied.length > 0) {
            console.log('denied Permission');
            reject(permissionsError);
          } else {
            console.log('granted Permission');
            resolve();
          }
        })
        .catch(error => {
          reject(error);
        });
    });

  return (
    <ScrollView
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Logo />
        <View style={{marginTop: 10, marginBottom: 20}}>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            ref={textInput1Ref}
            keyboardType="default"
            autoCapitalize="none"
            onChangeText={user_name => setUser_name(user_name)}
            value={user_name}
            returnKeyType="next"
            onSubmitEditing={() => textInput2Ref.current.focus()}
            autoCorrect={false}
            placeholderTextColor="#757575"
            underlineColorAndroid="transparent"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter roomId"
            autoCapitalize="none"
            ref={textInput2Ref}
            onChangeText={room_id => setRoom_id(room_id)}
            value={room_id}
            keyboardType="default"
            returnKeyType="next"
            autoCorrect={false}
            placeholderTextColor="#757575"
            underlineColorAndroid="transparent"
          />
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableHighlight
            style={styles.button}
            underlayColor="transparent"
            onPress={onCreateRoom}>
            <Text style={styles.buttonText}>Create Room</Text>
          </TouchableHighlight>

          <TouchableHighlight
            style={styles.button}
            underlayColor="transparent"
            onPress={onJoinRoom}>
            <Text style={styles.buttonText}>Join</Text>
          </TouchableHighlight>
        </View>
      </View>
    </ScrollView>
  );
}

// ExJoinScreen.propTypes = {
//   navigation: PropTypes.object
// };

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  input: {
    height: 40,
    width: 300,
    borderColor: '#eae7e7',
    backgroundColor: '#eae7e7',
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: 'center',
    color: 'black',
  },
  buttonsContainer: {
    flex: 2,
    flexDirection: 'row',
    width: 250,
    bottom: 0,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 25,
  },
  button: {
    height: 40,
    width: 120,
    borderColor: '#534367',
    backgroundColor: '#534367',
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    marginTop: 5,
    fontSize: 16,
    alignSelf: 'center',
    justifyContent: 'center',
  },
});
export default ExJoinScreen;
