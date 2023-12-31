const { Telegraf, Extra } = require("telegraf");
import botTelegramService from "../services/botTelegramService";
import constant from "../constant/constant.js";
import helpers from "../helper/botHelpers";
const moment = require("moment");
const path = require("path");
const cron = require("node-cron");
const fs = require("fs");
require("dotenv").config();

const botTelegram = async (app) => {
  let isFetchingData = true;
  const bot = new Telegraf(process.env.BOT_TOKEN_LIVE);
  const arrTemp = [];
  let filterItemChange = [];
  if (isFetchingData) {
    isFetchingData = false;
    // Công việc cron mỗi 5 giây
    await cron.schedule("*/3 * * * *", async () => {
      try {
        const data = await botTelegramService.getNewImage();
        if (data?.EC == 0 && data?.DT.length > 0) {
          if (arrTemp.length) {
            filterItemChange = data?.DT.filter(
              (itemB) =>
                !arrTemp.some((itemA) => itemA?.SessionId === itemB.SessionId)
            );
            arrTemp.length = 0;
            Array.prototype.push.apply(arrTemp, data?.DT);
          } else {
            filterItemChange = data?.DT;
            Array.prototype.push.apply(arrTemp, data?.DT);
          }
          if (filterItemChange.length) {
            for (const e of filterItemChange) {
              if (constant.numberCarIgnoreCheck.includes(e.BienSo)) continue;
              const imageFilePaths = e?.linkData?.map((image) =>
                path.join(constant.netWorkPath, image.LinkHA)
              );
              imageFilePaths?.unshift(
                path.join(constant.netWorkPath, e.srcAvatar)
              );
              console.log("check_imageFilePaths", imageFilePaths);
              // Đường dẫn tới các tệp ảnh con
              const mediaGroup = imageFilePaths
                .map((filePath) => {
                  if (fs.existsSync(filePath))
                    return {
                      type: "photo",
                      media: { source: fs.readFileSync(filePath) },
                    };
                })
                .filter((e) => !(e == undefined));
              console.log("check mediaGroup", mediaGroup);
              if (mediaGroup.length > 0) {
                let textNoti = `\n\n<b>----------------------------</b>\n\n<i>Mã học viên:</i><code style="color: red;"> <b style="color:red;">${
                  e?.MaDK
                }</b></code>\n<i>Họ Tên Học Viên:</i> <b>${
                  e?.HotenHV
                }</b>\n<i>Biển Số:</i> <b>${
                  e?.BienSo
                }</b>\n<i>Họ Tên Giáo Viên:</i> <b>${
                  e?.HotenGV
                }</b>\n<i>Tổng QĐ:</i> <b>${
                  e?.TongQuangDuong
                    ? parseFloat(e.TongQuangDuong).toFixed(2)
                    : ""
                } Km</b>\n<i>Tổng Thời Gian:</i> <b>${
                  e?.TongThoiGian ? parseFloat(e.TongThoiGian).toFixed(2) : ""
                } Giờ</b>\n<i>Thời điểm ĐN: </i><b>${
                  e?.ThoiDiemDangNhap
                    ? moment(e.ThoiDiemDangNhap)
                        .utcOffset("+0000")
                        .format(constant.outputFormat)
                    : ""
                }</b>\n<i>Thời điểm ĐX: </i><b>${
                  e?.ThoiDiemDangXuat
                    ? moment(e.ThoiDiemDangXuat)
                        .utcOffset("+0000")
                        .format(constant.outputFormat)
                    : ""
                }</b>\n\n`;
                const pr1 = await bot.telegram
                  .sendMessage(process.env.id_groupLiveStream, textNoti, {
                    parse_mode: "HTML",
                  })
                  .then(async () => {
                    await helpers.sleep(1.5);
                    await bot.telegram.sendMediaGroup(
                      process.env.id_groupLiveStream,
                      mediaGroup
                    );
                  });
                const pr2 = await helpers.sleep(20);
                await Promise.all([pr1, pr2]);
              } else {
                console.log("Chưa phát hiện phiên mới");
              }
            }
          }
        }
      } catch (error) {
        console.log("check error", error);
      }
    });

    // Cron job chạy vào lúc 17:30 mỗi ngày
    await cron.schedule("30 17 * * *", async () => {
      console.log("Cron job executed at 17:30 (5:30 PM) every day.");
      //Điểm danh
    });
    isFetchingData = true;
  }

  const helpMessage = `
      Vui lòng soạn đúng cú pháp
    `;

  const helpAdmin = `
        /testform dùng để test form
  `;

  try {
    bot.use(async (ctx, next) => {
      // ctx.reply('U use bot');
      try {
        console.log("bot đã hoạt động");
        console.log("check group ID livestream", ctx);
        console.log("check ctx chat id", ctx.chat);

        if (isFetchingData) {
          // if (ctx.chat.id != process.env.id_groupNLTB) {
          //   await ctx.replyWithHTML('Vui lòng không truy vấn dữ liệu hoặc nhắn riêng trên tin nhắn riêng của bot, vui lòng truy vấn trên group chính thức : <a href="https://t.me/+NR_DldQ80ak0MTRl">DAT_NLTB</a> . Muốn truy vấn riêng trên bot, vui lòng nhắn tin trực tiếp cho em Vy (0987980417) để được cấp quyền nhắn tin riêng trên bot 🤖🤖', { disable_web_page_preview: true })
          //   return
          // }
          if (!ctx?.message?.text) {
            isFetchingData = true;
            return;
          }

          if (ctx.update.message && ctx.update.message.new_chat_members) {
            for (let member of ctx.update.message.new_chat_members) {
              await ctx.reply(
                `Chào mừng thầy ${member.first_name} đến với nhóm! \n ${helpMessage}`
              );
              return;
            }
          }
          let input = ctx.message?.text?.split(" ");

          const checkNull = input[0]?.trim();
          console.log("check giá trị vào", checkNull);
          if (!checkNull) {
            await ctx.reply(helpMessage);
            isFetchingData = true;
            return;
          }

          await next(ctx); // nếu middleware thì cần await next trong mỗi ràng buộc
        }
      } catch (e) {
        console.log("check error", e);
        await ctx.reply(
          "Lỗi server bot, hãy liên hệ Khả Vy để được fix sớm nhất"
        );
        isFetchingData = true;
        return;
      }
    });

    bot.command("hinhanh", async (ctx) => {
      try {
        const startTime = performance.now();
        if (isFetchingData) {
          isFetchingData = false;
          console.log("DAT detected", ctx);
          let input = ctx.message.text.split(" ");
          input.shift();
          const car = input[0] ? input[0].trim().toUpperCase() : "";
          const date = input[1]
            ? input[1].trim()
            : moment().format("YYYY-MM-DD");

          console.log("car", car);
          if (!car) {
            await ctx.reply(helpMessage);
            isFetchingData = true;
            return;
          }

          const lstImage = await botTelegramService.getAllImageFromNumberCar(
            car,
            date
          );
          if (lstImage?.DT?.length > 0) {
            for (const e of lstImage.DT) {
              console.log("check e?.linkData", e?.linkData);
              const imageFilePaths = e?.linkData?.map((image) => {
                if (image) return path.join(constant.netWorkPath, image.LinkHA);
              });
              imageFilePaths?.unshift(
                path.join(constant.netWorkPath, e?.srcAvatar)
              );
              console.log("check_imageFilePaths", imageFilePaths);
              // Đường dẫn tới các tệp ảnh con
              const mediaGroup = imageFilePaths
                .map((filePath) => {
                  if (fs.existsSync(filePath))
                    return {
                      type: "photo",
                      media: { source: fs.readFileSync(filePath) },
                      caption: `https://${filePath
                        .slice(2, filePath.length)
                        .replace(/\\/g, ".")}.com`,
                    };
                })
                .filter((e) => e !== null && e !== undefined);
              console.log("check mediaGroup", mediaGroup);
              if (mediaGroup.length > 0) {
                let textNoti = `\n\n<b>----------------------------</b>\n\n<i>Mã học viên:</i><code style="color: red;"> <b style="color:red;">${
                  e?.MaDK
                }</b></code>\n<i>Họ Tên Học Viên:</i> <b>${
                  e?.HotenHV
                }</b>\n<i>Biển Số:</i> <b>${
                  e?.BienSo
                }</b>\n<i>Họ Tên Giáo Viên:</i> <b>${
                  e?.HotenGV
                }</b>\n<i>Tổng QĐ:</i> <b>${
                  e?.TongQuangDuong
                    ? parseFloat(e.TongQuangDuong).toFixed(2)
                    : ""
                } Km</b>\n<i>Tổng Thời Gian:</i> <b>${
                  e?.TongThoiGian ? parseFloat(e.TongThoiGian).toFixed(2) : ""
                } Giờ</b>\n<i>Thời điểm ĐN: </i><b>${
                  e?.ThoiDiemDangNhap
                    ? moment(e.ThoiDiemDangNhap)
                        .utcOffset("+0000")
                        .format(constant.outputFormat)
                    : ""
                }</b>\n<i>Thời điểm ĐX: </i><b>${
                  e?.ThoiDiemDangXuat
                    ? moment(e.ThoiDiemDangXuat)
                        .utcOffset("+0000")
                        .format(constant.outputFormat)
                    : ""
                }</b>\n\n`;
                if (helpers.checkOutTime(startTime)) {
                  isFetchingData = true;
                  return; // Dừng tác vụ
                }
                const prAll = await ctx.reply(textNoti, {
                  parse_mode: "HTML",
                });

                if (mediaGroup.length > 10) {
                  for (let i = 0; i < mediaGroup.length; i += 10) {
                    let showGroup = mediaGroup.slice(i, i + 10);
                    const pr2 = await ctx.replyWithMediaGroup(showGroup);
                    const pr4 = await helpers.sleep(1.5);
                    await Promise.all([pr2, pr4]);
                    if (helpers.checkOutTime(startTime)) {
                      isFetchingData = true;
                      return;
                    } // Dừng tác vụ
                  }
                } else {
                  const pr3 = await ctx.replyWithMediaGroup(mediaGroup);
                  const pr5 = await helpers.sleep(1.5);
                  await Promise.all([pr3, pr5]);
                  if (helpers.checkOutTime(startTime)) {
                    isFetchingData = true;
                    return;
                  } // Dừng tác vụ
                }
                await Promise.all([prAll]);
              }
            }
          }
        }
        isFetchingData = true;
        return; // Dừng tác vụ
      } catch (e) {
        console.log("check err", e);
        await ctx.reply("Vui lòng thử lại sau !!!");
        isFetchingData = true;
        return;
      }
    });
    bot.command("hinhanhhv", async (ctx) => {
      try {
        const startTime = performance.now();
        if (isFetchingData) {
          isFetchingData = false;
          console.log("DAT detected", ctx);
          const input = ctx.message.text
            .replace(/^\/\S+/, "")
            .trim()
            .split(" ");
          if (!input) {
            await ctx.reply(helpMessage);
            isFetchingData = true;
            return;
          }
          console.log("check input", input);
          const mhv = input[0]?.trim().toUpperCase();
          let date = null;
          if (input.length > 0) {
            date = input[1]?.trim();
          }

          console.log("mhv", mhv);
          if (!mhv) {
            await ctx.reply(helpMessage);
            isFetchingData = true;
            return;
          }

          const lstImage = await botTelegramService.getImageForStudent(
            mhv,
            date
          );
          if (lstImage?.DT?.length > 0) {
            for (const e of lstImage.DT) {
              console.log("check e?.linkData", e?.linkData);
              const imageFilePaths = e?.linkData?.map((image) => {
                if (image) return path.join(constant.netWorkPath, image.LinkHA);
              });
              imageFilePaths?.unshift(
                path.join(constant.netWorkPath, e?.srcAvatar)
              );
              console.log("check_imageFilePaths", imageFilePaths);
              // Đường dẫn tới các tệp ảnh con
              const mediaGroup = imageFilePaths
                .map((filePath) => {
                  if (fs.existsSync(filePath))
                    return {
                      type: "photo",
                      media: { source: fs.readFileSync(filePath) },
                      caption: `https://${filePath
                        .slice(2, filePath.length)
                        .replace(/\\/g, ".")}.com`,
                    };
                })
                .filter((e) => e !== null && e !== undefined);
              console.log("check mediaGroup", mediaGroup);
              if (mediaGroup.length > 0) {
                let textNoti = `\n\n<b>----------------------------</b>\n\n<i>Mã học viên:</i><code style="color: red;"> <b style="color:red;">${
                  e?.MaDK
                }</b></code>\n<i>Họ Tên Học Viên:</i> <b>${
                  e?.HotenHV
                }</b></code>\n<i>Khóa học:</i> <b>${
                  e?.TenKH
                }</b>\n<i>Biển Số:</i> <b>${
                  e?.BienSo
                }</b>\n<i>Họ Tên Giáo Viên:</i> <b>${
                  e?.HotenGV
                }</b>\n<i>Tổng Quãng Đường:</i> <b>${
                  e?.TongQuangDuong
                    ? parseFloat(e.TongQuangDuong).toFixed(2)
                    : ""
                } Km</b>\n<i>Tổng Thời Gian:</i> <b>${
                  e?.TongThoiGian ? parseFloat(e.TongThoiGian).toFixed(2) : ""
                } Giờ</b>\n<i>Thời điểm Đăng Nhập: </i><b>${
                  e?.ThoiDiemDangNhap
                    ? moment(e.ThoiDiemDangNhap)
                        .utcOffset("+0000")
                        .format(constant.outputFormat)
                    : ""
                }</b>\n<i>Thời điểm Đăng Xuất: </i><b>${
                  e?.ThoiDiemDangXuat
                    ? moment(e.ThoiDiemDangXuat)
                        .utcOffset("+0000")
                        .format(constant.outputFormat)
                    : ""
                }</b>\n\n`;
                if (helpers.checkOutTime(startTime)) {
                  isFetchingData = true;
                  return; // Dừng tác vụ
                }
                const prAll = await ctx.reply(textNoti, {
                  parse_mode: "HTML",
                });

                if (mediaGroup.length > 10) {
                  for (let i = 0; i < mediaGroup.length; i += 10) {
                    let showGroup = mediaGroup.slice(i, i + 10);
                    const pr2 = await ctx.replyWithMediaGroup(showGroup);
                    const pr4 = await helpers.sleep(1.5);
                    await Promise.all([pr2, pr4]);
                    if (helpers.checkOutTime(startTime)) {
                      isFetchingData = true;
                      return;
                    } // Dừng tác vụ
                  }
                } else {
                  const pr3 = await ctx.replyWithMediaGroup(mediaGroup);
                  const pr5 = await helpers.sleep(1.5);
                  await Promise.all([pr3, pr5]);
                  if (helpers.checkOutTime(startTime)) {
                    isFetchingData = true;
                    return;
                  } // Dừng tác vụ
                }
                await Promise.all([prAll]);
              }
            }
          }
        }
        isFetchingData = true;
        return; // Dừng tác vụ
      } catch (e) {
        console.log("check err", e);
        await ctx.reply("Vui lòng thử lại sau !!!");
        isFetchingData = true;
        return;
      }
    });

    bot.command("help", async (ctx) => {
      if (isFetchingData) {
        isFetchingData = false;
        await ctx.reply(helpMessage);
        isFetchingData = true;
        return;
      }
      isFetchingData = true;
      return;
    });
  } catch (e) {
    // Gửi một tin nhắn
    bot.telegram
      .sendMessage(
        process.env.id_groupNLTB,
        "Lỗi nghiêm trọng, vui lòng đợi trong giây lát"
      )
      .then(() => {
        console.log("Đã gửi tin nhắn thành công");
      })
      .catch((error) => {
        console.log("Lỗi khi gửi tin nhắn:", error);
      });
    isFetchingData = true;
  }

  bot.launch();

  // Enable graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
export default botTelegram;
