import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  Alert,
  TouchableHighlight,
  TextInput,
  Button,
  View,
  Dimensions,
  Image,
  PermissionsAndroid,
  FlatList,
} from "react-native";
import PropTypes from "prop-types";
import { EnxRoom, Enx, EnxStream, EnxPlayerView, EnxToolBarView } from "enx-rtc-react-native";
import axios from "axios";
import { BackHandler } from "react-native";
import { Navigation, Route } from "@react-navigation/native";

const calculateColumn = (data) => {
  if (data.length === 1 || data.length === 2) return 1;
  else return 2;
};

const calculateRow = (data) => {
  if (data.length === 1) return 1;
  else if (data.length === 2 || data.length === 3 || data.length === 4) return 2;
  else if (data.length === 5 || data.length === 6) return 3;
  else if (data.length === 7 || data.length === 8) return 4;
  else if (data.length === 9 || data.length === 10 || data.length > 10) return 5;
};

const EnxVideoView = ({ navigation, route }) => {
  const [permissionError, setPermissionError] = useState(false);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get("window").height);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [noOfColumn, setNoOfColumn] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [deviceList, setDeviceList] = useState([]);
  const [base64Icon, setBase64Icon] = useState("");
  const [activeTalkerStreams, setActiveTalkerStreams] = useState([]);
  const [isUpdated, setIsUpdated] = useState(false);
  const [recordingCheck, setRecordingCheck] = useState(false);
  const [screenShareCheck, setScreenShareCheck] = useState(false);
  const [toolBarCheck, setToolBarCheck] = useState(false);
  const [audioMuteUnmuteCheck, setAudioMuteUnmuteCheck] = useState(true);
  const [audioMuteUnmuteImage, setAudioMuteUnmuteImage] = useState(require("./image_asset/unmute.png"));
  const [videoMuteUnmuteCheck, setVideoMuteUnmuteCheck] = useState(true);
  const [videoMuteUnmuteImage, setVideoMuteUnmuteImage] = useState(require("./image_asset/startvideo.png"));
  const [rotateCamera, setRotateCamera] = useState(false);
  const [rotateCameraImage, setRotateCameraImage] = useState(require("./image_asset/switchcamera.png"));
  const [canvasCheck, setCanvasCheck] = useState(false);
  const [annotationCheck, setAnnotationCheck] = useState(false);
  const [localStreamId, setLocalStreamId] = useState("0");
  const [screenShareId, setScreenShareId] = useState(null);
  const [canvasStreamId, setCanvasStreamId] = useState(null);
  const [activeStreamId, setActiveStreamId] = useState(null);
  const [annotationStreamId, setAnnotationStreamId] = useState(null);
  const [advanceOptions, setAdvanceOptions] = useState({});
  const [roomConnected, setRoomConnected] = useState(false);
  const [layoutCheck, setLayoutCheck] = useState(false);
  const [streamInfo, setStreamInfo] = useState({});

  const roomInfo = route.params.roomInfo;

  useEffect(() => {
    // Request required permissions
    requestPermissions();

    // Event listener for handling back button press
    BackHandler.addEventListener("hardwareBackPress", handleBackButton);

    // Clean up function
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackButton);
    };
  }, []);

  useEffect(() => {
    // Set the base64 icon for the toolbar
    setBase64Icon(`data:image/png;base64,${roomInfo.icon}`);

    // Set the device list
    setDeviceList(roomInfo.deviceList);

    // Set the advance options
    setAdvanceOptions(roomInfo.advanceOptions);

    // Set the initial screen share check
    setScreenShareCheck(roomInfo.advanceOptions.screen_share === "true");

    // Set the initial recording check
    setRecordingCheck(roomInfo.advanceOptions.recording === "true");
  }, [roomInfo]);

  useEffect(() => {
    // Calculate the number of columns based on the active talker streams
    const columnCount = calculateColumn(activeTalkerStreams);
    setNoOfColumn(columnCount);

    // Calculate the number of rows based on the active talker streams
    const rowCount = calculateRow(activeTalkerStreams);
    setScreenHeight(Dimensions.get("window").height / rowCount);
    setIsHorizontal(rowCount > 1);
  }, [activeTalkerStreams]);

  const handleBackButton = () => {
    // Handle back button press
    if (roomConnected) {
      disconnectRoom();
    } else {
      navigation.goBack();
    }
    return true;
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          granted["android.permission.CAMERA"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.RECORD_AUDIO"] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          // Permission granted
          console.log("Camera and audio permission granted");
        } else {
          // Permission denied
          setPermissionError(true);
          console.log("Camera and audio permission denied");
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleJoinRoom = async () => {
    try {
      const token = await fetchToken(); // Fetch the token from the server
      const client = EnxRtc.createClient(); // Create the EnxRtc client
      const room = await client.joinRoom(token); // Join the room using the token
      setRoomConnected(true); // Set roomConnected to true

      // Add event listeners for room events
      room.addEventListener("room-connected", onRoomConnected);
      room.addEventListener("room-disconnected", onRoomDisconnected);
      room.addEventListener("stream-added", onStreamAdded);
      room.addEventListener("stream-removed", onStreamRemoved);
      room.addEventListener("active-talkers-updated", onActiveTalkersUpdated);
      room.addEventListener("canvas-annotations-started", onCanvasAnnotationsStarted);
      room.addEventListener("canvas-annotations-stopped", onCanvasAnnotationsStopped);
      room.addEventListener("canvas-annotations-data", onCanvasAnnotationsData);
      room.addEventListener("canvas-started", onCanvasStarted);
      room.addEventListener("canvas-stopped", onCanvasStopped);
      room.addEventListener("canvas-data", onCanvasData);

      // Store the local stream ID
      setLocalStreamId(room.localStreamID);

      // Enable advance options if available
      if (advanceOptions) {
        room.enableAdvanceOptions(advanceOptions);
      }
    } catch (err) {
      console.error("Error joining room: ", err);
      Alert.alert("Error", "Failed to join the room. Please try again.");
    }
  };

  const disconnectRoom = () => {
    EnxRtc.disconnect(); // Disconnect from the room
    setRoomConnected(false); // Set roomConnected to false
    navigation.goBack(); // Navigate back to the previous screen
  };

  const fetchToken = async () => {
    try {
      const response = await axios.get("YOUR_TOKEN_ENDPOINT"); // Replace with your token endpoint
      return response.data.token;
    } catch (error) {
      console.error("Error fetching token: ", error);
      throw new Error("Failed to fetch token");
    }
  };

  const onRoomConnected = () => {
    console.log("Room Connected");
  };

  const onRoomDisconnected = () => {
    console.log("Room Disconnected");
  };

  const onStreamAdded = (event) => {
    const { stream } = event;
    const newStream = {
      streamId: stream.getID(),
      isLocal: stream.isLocal(),
      hasVideo: stream.hasVideo(),
      hasAudio: stream.hasAudio(),
    };
    setStreamInfo((prevStreamInfo) => {
      const updatedStreamInfo = { ...prevStreamInfo };
      updatedStreamInfo[newStream.streamId] = newStream;
      return updatedStreamInfo;
    });
  };

  const onStreamRemoved = (event) => {
    const { stream } = event;
    setStreamInfo((prevStreamInfo) => {
      const updatedStreamInfo = { ...prevStreamInfo };
      delete updatedStreamInfo[stream.getID()];
      return updatedStreamInfo;
    });
  };

  const onActiveTalkersUpdated = (event) => {
    const { activeList } = event;
    setActiveTalkerStreams(activeList);
  };

  const onCanvasAnnotationsStarted = () => {
    console.log("Canvas Annotations Started");
  };

  const onCanvasAnnotationsStopped = () => {
    console.log("Canvas Annotations Stopped");
  };

  const onCanvasAnnotationsData = () => {
    console.log("Canvas Annotations Data");
  };

  const onCanvasStarted = () => {
    console.log("Canvas Started");
  };

  const onCanvasStopped = () => {
    console.log("Canvas Stopped");
  };

  const onCanvasData = () => {
    console.log("Canvas Data");
  };

  const toggleAudioMuteUnmute = () => {
    setAudioMuteUnmuteCheck(!audioMuteUnmuteCheck);
    if (audioMuteUnmuteCheck) {
      EnxRtc.muteSelfAudio();
      setAudioMuteUnmuteImage(require("./image_asset/mute.png"));
    } else {
      EnxRtc.unmuteSelfAudio();
      setAudioMuteUnmuteImage(require("./image_asset/unmute.png"));
    }
  };

  const toggleVideoMuteUnmute = () => {
    setVideoMuteUnmuteCheck(!videoMuteUnmuteCheck);
    if (videoMuteUnmuteCheck) {
      EnxRtc.muteSelfVideo();
      setVideoMuteUnmuteImage(require("./image_asset/stopvideo.png"));
    } else {
      EnxRtc.unmuteSelfVideo();
      setVideoMuteUnmuteImage(require("./image_asset/startvideo.png"));
    }
  };

  const toggleRotateCamera = () => {
    setRotateCamera(!rotateCamera);
    if (rotateCamera) {
      EnxRtc.switchCamera();
      setRotateCameraImage(require("./image_asset/switchcamera.png"));
    } else {
      EnxRtc.switchCamera();
      setRotateCameraImage(require("./image_asset/switchcamera.png"));
    }
  };

  const toggleCanvas = () => {
    setCanvasCheck(!canvasCheck);
    if (canvasCheck) {
      EnxRtc.disableCanvas();
    } else {
      EnxRtc.enableCanvas();
    }
  };

  const toggleAnnotation = () => {
    setAnnotationCheck(!annotationCheck);
    if (annotationCheck) {
      EnxRtc.disableAnnotations();
    } else {
      EnxRtc.enableAnnotations();
    }
  };

  const renderStream = ({ item }) => {
    const stream = streamInfo[item];
    if (stream && stream.hasVideo) {
      return (
        <EnxPlayerView
          streamId={stream.streamId}
          style={{ flex: 1, aspectRatio: 1 }}
          mirror={stream.isLocal}
        />
      );
    } else {
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableHighlight onPress={disconnectRoom} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableHighlight>
        <View style={styles.titleContainer}>
          <Image source={{ uri: base64Icon }} style={styles.icon} />
          <Text style={styles.title}>{roomInfo.name}</Text>
        </View>
        <View style={styles.emptyView} />
      </View>
      {roomConnected ? (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <FlatList
              data={activeTalkerStreams}
              renderItem={renderStream}
              keyExtractor={(item) => item}
              numColumns={noOfColumn}
            />
          </View>
          <View style={styles.toolbarContainer}>
            <EnxToolBarView
              style={styles.toolbar}
              onAudioMuteUnmute={toggleAudioMuteUnmute}
              audioMuteUnmuteImage={audioMuteUnmuteImage}
              onVideoMuteUnmute={toggleVideoMuteUnmute}
              videoMuteUnmuteImage={videoMuteUnmuteImage}
              onSwitchCamera={toggleRotateCamera}
              rotateCameraImage={rotateCameraImage}
              onCanvas={toggleCanvas}
              canvasCheck={canvasCheck}
              onAnnotation={toggleAnnotation}
              annotationCheck={annotationCheck}
              screenShareCheck={screenShareCheck}
              recordingCheck={recordingCheck}
              layoutCheck={layoutCheck}
            />
          </View>
        </View>
      ) : permissionError ? (
        <Text style={styles.errorText}>Camera and audio permission required</Text>
      ) : (
        <View style={styles.joinButtonContainer}>
          <Button onPress={handleJoinRoom} title="Join Room" />
        </View>
      )}
    </View>
  );
};

EnxVideoView.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: Platform.OS === "ios" ? 50 : 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e6e6e6",
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007bff",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyView: {
    width: 40,
  },
  toolbarContainer: {
    height: 100,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e6e6e6",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toolbar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  joinButtonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    color: "red",
  },
});

export default EnxVideoView;
