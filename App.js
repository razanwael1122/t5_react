import React, { useState, useEffect, useRef } from "react";
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

const MergeImages = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const mergeRef = useRef(null);

  useEffect(() => {
    getCameraRollPermissions();
  }, []);

  const getCameraRollPermissions = async () => {
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

  const openCamera = async () => {
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
        setImages((prevImages) => [...prevImages, imageUri]);
        saveImageToGallery(imageUri); // Save the image immediately
      }
    }
  };

  const deleteImage = () => {
    setImages((prevImages) => {
      const updatedImages = prevImages.filter(
        (_, index) => index !== selectedImageIndex
      );
      return updatedImages;
    });
  };

  const mergeImages = async () => {
    if (images.length < 10) {
      alert("Please capture 10 images first!");
      return;
    }
    try {
      const mergedImage = await merge(images);
      saveMergedImage(mergedImage);
    } catch (error) {
      alert(`Error merging images: ${error.message}`);
    }
  };

  const merge = async (images) => {
    try {
      const image1 = { uri: images[0] };
      const image2 = { uri: images[1] };

      const mergedImage = await ImageManipulator.manipulateAsync(
        [image1, image2],
        [{ resize: { width: image1.width } }],
        { format: "png" }
      );

      return mergedImage.uri;
    } catch (error) {
      // throw new Error("Error merging images. Please try again.");
    }
  };

  const saveMergedImage = async (image) => {
    try {
      const uri = await captureRef(mergeRef, {
        format: "png",
        quality: 1,
      });

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.saveToLibraryAsync(asset);
      alert("Images merged and saved successfully!");
      console.log("Merged image URI:", asset.uri);
    } catch (error) {
      //alert("Error saving merged image. Please try again.");
      console.log(error);
    }
  };

  const saveImageToGallery = async (imageUri) => {
    try {
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      await MediaLibrary.saveToLibraryAsync(asset);
      console.log("Saved image URI:", asset.uri);
    } catch (error) {
      console.log(error);
    }
  };

  const openImage = (imageUri, index) => {
    setSelectedImage(imageUri);
    setSelectedImageIndex(index);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
        <Text style={styles.buttonText}>Capture Image</Text>
      </TouchableOpacity>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        horizontal={true}
      >
        <View style={styles.imageContainer} ref={mergeRef}>
          {images.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <TouchableOpacity onPress={() => openImage(image, index)}>
                <Image
                  source={{ uri: image }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.mergeButton} onPress={mergeImages}>
        <Text style={styles.buttonText}>Merge Images</Text>
      </TouchableOpacity>
      {selectedImage && (
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteImage}>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flexDirection: "row",
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
    top: 100,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  imageWrapper: {
    width: "50%",
    flex: 1,
    alignItems: "center",
  },
  image: {
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
