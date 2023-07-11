import React, { useState, useEffect, createRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { ImageManipulator } from "expo-image-manipulator";
import { captureRef } from "react-native-view-shot";

class MergeImages extends React.Component {
  constructor(props) {
    super(props);
    this.mergeRef = createRef();
    this.state = {
      images: [],
      selectedImage: null,
      selectedImageIndex: null,
    };
  }

  componentDidMount() {
    this.getCameraRollPermissions();
  }

  getCameraRollPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || mediaStatus !== "granted") {
        alert(
          "Sorry, we need camera and media library permissions to access the images!"
        );
      }
    }
  };
  //////////////////////////////////////////////////////
  openCamera = async () => {
    let result;
    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: true,
        exif: false,
      });
    } catch (error) {
      console.log("Error capturing image:", error);
      return;
    }

    if (!result.canceled) {
      const { assets } = result;
      if (assets && assets.length > 0) {
        const imageUri = assets[0].uri;
        this.setState((prevState) => ({
          images: [...prevState.images, imageUri],
        }));
        this.saveImageToGallery(imageUri);
      }
    }
  };
  //////////////////////////////////////////////////////////
  deleteImage = () => {
    const { selectedImageIndex } = this.state;
    this.setState((prevState) => {
      const updatedImages = prevState.images.filter(
        (_, index) => index !== selectedImageIndex
      );
      return {
        images: updatedImages,
        selectedImage: null,
        selectedImageIndex: null,
      };
    });
  };
  ////////////////////////////////////////////////////////
  mergeImages = async () => {
    const { images } = this.state;
    if (images.length < 4) {
      alert("Please capture 4 images first!");
      return;
    }

    try {
      const image1 = { uri: images[0] };
      const image2 = { uri: images[1] };

      const mergedImage = await ImageManipulator.manipulateAsync(
        [image1, image2],
        [{ resize: { width: image1.width } }],
        { format: "png" }
      );

      return mergedImage.uri;
    } catch (error) {}
  };
  /////////////////////////////////////////////////////////////
  saveMergedImage = async (image) => {
    try {
      const mergedRef = this.mergeRef.current;
      await new Promise((resolve) => {
        setTimeout(resolve, 40);
      });

      const uri = await captureRef(mergedRef, {
        format: "png",
        quality: 1,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.saveToLibraryAsync(asset);
      alert("Images merged and saved successfully!");
    } catch (error) {}
  };
  //////////////////////////////////////////////////////////
  saveImageToGallery = async (imageUri) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      await MediaLibrary.saveToLibraryAsync(asset);
    } catch (error) {}
  };
  ///////////////////////////////////////////////////////////////
  openImage = (imageUri, index) => {
    this.setState({
      selectedImage: imageUri,
      selectedImageIndex: index,
    });
  };
  //////////////////////////////////////////////
  render() {
    const { images, selectedImage } = this.state;

    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.cameraButton} onPress={this.openCamera}>
          <Text style={styles.buttonText}>Capture Image</Text>
        </TouchableOpacity>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          horizontal={true}
        >
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <TouchableOpacity onPress={() => this.openImage(image, index)}>
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
        </ScrollView>
        <TouchableOpacity style={styles.mergeButton} onPress={this.mergeImages}>
          <Text style={styles.buttonText}>Merge Images</Text>
        </TouchableOpacity>
        {selectedImage && (
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => this.setState({ selectedImage: null })}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={this.deleteImage}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    marginVertical: 10,
    maxHeight: 200,
  },
  contentContainer: {
    alignItems: "center",
  },
  cameraButton: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    bottom: 50,
  },
  mergeButton: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  imageWrapper: {
    width: 200,
    height: 200,
    borderRadius: 1,
    margin: 1,
  },
  deleteButton: {
    position: "absolute",
    top: 25,
    padding: 10,
    left: 20,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 29,
    right: 20,
    padding: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedImage: {
    width: "80%",
    height: "50%",
    borderRadius: 10,
  },
});

export default MergeImages;
