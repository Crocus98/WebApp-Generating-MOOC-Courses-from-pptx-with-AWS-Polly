export const a = 1;

/*
export async function getNotes() {
  return new Promise((resolve, reject) => {
    let texts = [];

    //TODO: Need to absolute path from Driver funcation.
    fs.readdir(folderPath, function (err, files) {
      //handling error
      if (err) {
        console.log("Unable to scan directory: " + err);
        reject(err);
      }
      //listing all files using forEach
      files.forEach(function (file) {
        // Do whatever you want to do with the file
        try {
          if (file.includes("notesSlide")) {
            name = file.toString();
            temp_path = folderPath + file;

            let xmlContent = require("fs").readFileSync(temp_path, "utf8");

            // Extract slide notes from xml using <a:t> tags
            let openTextTag = xmlContent.indexOf("<a:t>");
            let closeTextTag = 0;
            let endTextTag = xmlContent.indexOf("</p:txBody>");
            let text = "";
            while (openTextTag < endTextTag && openTextTag != -1) {
              closeTextTag = xmlContent.indexOf("</a:t>", openTextTag);
              text += entities.decode(
                xmlContent.slice(openTextTag + 5, closeTextTag)
              );
              openTextTag = xmlContent.indexOf("<a:t>", closeTextTag);
            }
            // Add <speak> tag for Polly
            text = "<speak>" + text + "</speak>";

            let slide_number = file.match(/\d+/).toString();
            texts.push([slide_number, text]);
          }
        } catch (e) {
          // console.log(temp_path, e.message);
          return;
        }
      });
      resolve(texts);
    });
  });
}
*/

/*
        await Promise.all(
          Object.keys(zip.files).map(async (relativePath) => {
            const file = zip.file(relativePath);
            const ext = relativePath.split(".").pop();
            console.log(ext);
            let content;
            if (!file || file.dir) {
              return;
            } else if (ext === "xml" || ext === "rels") {
              const xml = await file.async("binarystring");
              content = await xml2js.parseStringPromise(xml);
            } else {
              // Handles media assets (image, audio, video, etc.)
              content = await file.async("arraybuffer");
            }

            json[relativePath] = content;
          })
        );
        console.log(json);
        */
