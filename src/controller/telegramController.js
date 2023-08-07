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

  if (isFetchingData) {
    isFetchingData = false;
    // Công việc cron mỗi 5 giây
    await cron.schedule("20 */3 * * * *", async () => {
      try {
        const data = await botTelegramService.getNewImage();
        if (data?.EC == 0 && data?.DT.length > 0) {
          for (const e of data?.DT) {
            console.log("check e?.linkData", e?.linkData);
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
              .filter((e) => e != undefined);
            console.log("check mediaGroup", mediaGroup);
            if (mediaGroup.length > 0) {
              let textNoti = `\n\n<b>----------------------------------------------------------</b>\n\n<i>Mã học viên:</i><code style="color: red;"> <b style="color:red;">${
                e?.MaDK
              }</b></code>\n<i>Họ Tên Học Viên:</i> <b>${
                e?.HotenHV
              }</b>\n<i>Biển Số:</i> <b>${
                e?.BienSo
              }</b>\n<i>Họ Tên Giáo Viên:</i> <b>${
                e?.HotenGV
              }</b>\n<i>Thời gian gửi dữ liệu:</i><b>${
                e?.TimeSendCenter
                  ? moment(e.TimeSendCenter)
                      .utcOffset("+0000")
                      .format(constant.outputFormat)
                  : ""
              }</b>\n\n`;
              await bot.telegram
                .sendMessage(process.env.id_groupLiveStream, textNoti, {
                  parse_mode: "HTML",
                })
                .then(async () => {
                  await bot.telegram.sendMediaGroup(
                    process.env.id_groupLiveStream,
                    mediaGroup
                  );
                });
              await helpers.sleep(15);
            }
          }
        }
      } catch (error) {
        console.log("check error", error);
      }
    });
    isFetchingData = true;
  }

  const helpMessage = `
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
