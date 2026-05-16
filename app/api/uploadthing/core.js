import { createUploadthing } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  taskAttachment: f({ 
    image: { maxFileSize: "8MB", maxFileCount: 4 }, 
    pdf: { maxFileSize: "16MB", maxFileCount: 4 },
    text: { maxFileSize: "4MB", maxFileCount: 4 },
    blob: { maxFileSize: "16MB", maxFileCount: 4 } // For generic files like zip, docs
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const { userId } = await auth();

      // If you throw, the user will not be able to upload
      if (!userId) throw new Error("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.url };
    }),
};
