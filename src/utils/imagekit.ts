import ImageKit from "imagekit";
import env from "./env";

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

const imagekitUpload = async (imageFile: File) => {
  try {
    const fileBuffer = await imageFile.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString("base64");

    const uploadResponse = imagekit.upload({
      file: fileBase64,
      fileName: imageFile.name,
      folder: "/uploads",
    });

    return uploadResponse;
  } catch (error: any) {
    console.log(`Failed to upload image: ${error.message}`);
    return null;
  }
};

export { imagekitUpload };
