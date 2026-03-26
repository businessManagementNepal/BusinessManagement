import * as React from "react";
import { View } from "react-native";
import "./global.css";
import LoginRoute from "./(auth)/login";

export default function Index() {
  return (
    <View className="h-full">
      <LoginRoute />
    </View>
  );
}
