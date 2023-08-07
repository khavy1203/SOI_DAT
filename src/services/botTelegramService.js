const dotenv = require("dotenv");
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const moment = require("moment");
import constant from "../constant/constant";
const sql = require("mssql");

const pathFolderFileExcels = path.join(__dirname + "..\\..\\") + "fileExcels";

const getNewImage = async () => {
  let connection;
  try {
    // Kết nối tới SQL Server
    connection = await sql.connect(constant.config);

    // Tạo một request để thực hiện truy vấn
    const request = new sql.Request();

    // Truy vấn dữ liệu
    const result =
      await request.query(`select  top (10) ht.MaDK, hv.srcAvatar, dbo.GetEcoString(hv.HoTen) as HotenHV, dbo.GetEcoString(gv.HoTen) as HotenGV, ht.BienSo, TimeSendCenter,  ht.SessionId from HanhTrinhTuEtm ht
	  left join HocVienTH hv on hv.MaDK = ht.MaDK
	  left join KhoaHoc kh on  kh.ID = hv.IDKhoaHoc 
	  left join GiaoVienTH gv on gv.MaGV = ht.IDGV
	  order by TimeSendCenter desc`);

    // Xử lý kết quả truy vấn tại đây
    // Đóng kết nối
    if (connection) {
      try {
        if (result.recordset.length > 0) {
          const data = await Promise.all(
            result.recordset.map(async (e) => {
              const arrImage = await request.query(
                `select ID, RIGHT(dbo.GetEcoString(SrcHV), LEN(dbo.GetEcoString(SrcHV)) - 24) as LinkHA from AnhHanhTrinh where SessionId = '${e.SessionId}'`
              );
              let newArrayLink = [];
              if (arrImage.recordset.length >=7) {
                const deleteSessionFirstEnd = arrImage.recordset.slice(1, -1);
                for (let i = 2; i < 5; i++) {
                  const getIndex = parseInt(deleteSessionFirstEnd.length / i);
                  if (i == 2) {
                    newArrayLink.push(deleteSessionFirstEnd[getIndex]);
                  } else {
                    newArrayLink.push(
                      deleteSessionFirstEnd[getIndex],
                      deleteSessionFirstEnd[parseInt(getIndex+deleteSessionFirstEnd.length/2)]
                    );
                  }
                }
              } else {
                newArrayLink = arrImage.recordset;
              }
              return {
                ...e,
                linkData: newArrayLink,
              };
            })
          );
          await connection.close();
          return {
            EM: "Truy vấn thành công",
            EC: 0,
            DT: data,
          };
        } else {
          await connection.close();
          return {
            EM: "Dữ liệu trống",
            EC: 1,
            DT: [],
          };
        }
      } catch (err) {
        return {
          EM: "Truy vấn thất bại",
          EC: 1,
          DT: [],
        };
      }
    }
  } catch (err) {
    console.log("check err", err);
    return {
      EM: "Truy vấn thất bại",
      EC: -1,
      DT: [],
    };
  }
};

module.exports = {
  getNewImage,
};