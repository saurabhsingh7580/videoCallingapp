import React from "react";
import { StyleSheet, View, Text, Image } from "react-native";

import logoImg from "./image_asset/logofront.png";

const Logo = () => {
  return (
    <View style={styles.container}>
      <Image source={logoImg} style={styles.image} />
      <Text style={styles.text}>Welcome!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "center"
  },
  image: {
    height: 50,
    width: 220,
    marginTop: 100
  },
  text: {
    color: "black",
    alignSelf: "center",
    fontSize: 28,
    marginTop: 75
  }
});

export default Logo;