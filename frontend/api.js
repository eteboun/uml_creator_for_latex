import { apiUrls } from "./config.js";

export async function createUml(code) {
  const response = await fetch(apiUrls.createUml, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: code
  });  
  
  return response.json();
}