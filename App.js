import * as React from 'react';
import {View, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import EnxJoinScreen from './src/EnxJoinScreen';
import EnxConferenceScreen from './src/EnxConferenceScreen';
// changes

const Stack = createStackNavigator();

function App() {
  return (
    // <NavigationContainer>
    //   <Stack.Navigator>
    //     <Stack.Screen name="EnxJoinScreen" component={EnxJoinScreen} />
    //     <Stack.Screen name="EnxConferenceScreen" component={EnxConferenceScreen} />
    //   </Stack.Navigator>
    // </NavigationContainer>

    <View>
      <Text>Hello</Text>
    </View>
  );
}

export default App;
