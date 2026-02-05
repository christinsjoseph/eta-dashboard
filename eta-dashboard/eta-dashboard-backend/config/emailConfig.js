import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kristinjoseph04@gmail.com",
    pass: "ddxk bglo hnqo quux"
  }
});
