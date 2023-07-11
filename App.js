import React, { useState, useEffect, createRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
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

  mergeImages = async () => {
    const { images } = this.state;
    if (images.length < 10) {
      alert("Please capture 10 images first!");
      return;
    }

    if (images.length > 10) {
      alert("Cannot merge more than 10 images!");
      return;
    }

    try {
      const mergedImage = await this.merge(images);
      await this.saveMergedImage(mergedImage);
      alert("Images merged and saved successfully!");
    } catch (error) {}
  };

  merge = async (images) => {
    try {
      const processedImages = await Promise.all(
        images.map(async (imageUri) => {
          const { width, height } = await Image.getSizeAsync(imageUri);
          return { uri: imageUri, width, height };
        })
      );

      const maxWidth = Math.max(...processedImages.map((img) => img.width));
      const totalHeight = processedImages.reduce(
        (sum, img) => sum + img.height,
        0
      );

      const canvasWidth = maxWidth;
      const canvasHeight = totalHeight;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");

      let offsetY = 0;
      for (const { uri, width, height } of processedImages) {
        const image = { uri };
        const { uri: processedUri } = await ImageManipulator.manipulateAsync(
          [image],
          [{ resize: { width, height } }],
          { format: "png" }
        );
        const img = new Image();
        img.src = processedUri;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        const x = (canvasWidth - width) / 2;
        ctx.drawImage(img, x, offsetY, width, height);
        offsetY += height;
      }

      const mergedImage = canvas.toDataURL("image/png");
      return mergedImage;
    } catch (error) {}
  };

  mergeHorizontally = async (images) => {
    try {
      const mergedImage = await ImageManipulator.manipulateAsync(
        images,
        [{ concatenate: { axis: "horizontal" } }],
        { format: "png" }
      );

      return mergedImage.uri;
    } catch (error) {}
  };

  mergeVertically = async (image1, image2) => {
    try {
      const mergedImage = await ImageManipulator.manipulateAsync(
        [{ uri: image1 }, { uri: image2 }],
        [{ concatenate: { axis: "vertical" } }],
        { format: "png" }
      );

      return mergedImage.uri;
    } catch (error) {}
  };

  saveMergedImage = async (image) => {
    try {
      const mergedRef = this.mergeRef.current;
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
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

  saveImageToGallery = async (imageUri) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      await MediaLibrary.saveToLibraryAsync(asset);
      console.log("Saved image URI:", asset.uri);
    } catch (error) {}
  };

  openImage = (imageUri, index) => {
    this.setState({
      selectedImage: imageUri,
      selectedImageIndex: index,
    });
  };

  render() {
    const { images, selectedImage } = this.state;

    // Divide images into two rows
    const firstRowImages = images.slice(0, 5);
    const secondRowImages = images.slice(5, 10);

    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.cameraButton} onPress={this.openCamera}>
          <Text style={styles.buttonText}>Capture Image</Text>
        </TouchableOpacity>
        <View style={styles.imageContainer} ref={this.mergeRef}>
          {/* First Row */}
          <View style={styles.rowContainer}>
            {firstRowImages.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <TouchableOpacity onPress={() => this.openImage(image, index)}>
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Second Row */}
          <View style={styles.rowContainer}>
            {secondRowImages.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <TouchableOpacity
                  onPress={() => this.openImage(image, index + 5)}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
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
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    marginBottom: 10,
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
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  image: {
    width: 70,
    height: 90,
    borderRadius: 1,
  },
  deleteButton: {
    position: "absolute",
    top: 33,
    left: 5,
    backgroundColor: "red",
    padding: 5,
    borderRadius: 5,
    zIndex: 1,
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
