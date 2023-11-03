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
      await request.query(`select  top (10) ht.MaDK, hv.srcAvatar, dbo.GetEcoString(hv.HoTen) as HotenHV, dbo.GetEcoString(gv.HoTen) as HotenGV, ht.BienSo, TimeSendCenter, ht.ThoiDiemDangNhap, ht.ThoiDiemDangXuat, dbo.GetEcoString(ht.TongQuangDuong) as TongQuangDuong , cast (dbo.GetEcoString(ht.TongThoiGian) as float)/3600 as TongThoiGian ,  ht.SessionId 
      from HanhTrinhTuEtm ht
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

const getInfoStudent = async (name) => {
	let connection;
	try {
		// Kết nối tới SQL Server
		console.log("check constant.config", constant.config)
		connection = await sql.connect(constant.config);
		console.log('Connected to SQL Server');

		// Tạo một request để thực hiện truy vấn
		const request = new sql.Request();
		const typeOffName = checkValueType(name);
		let optionQuery = "";
		if (typeOffName) {
			//là số
			optionQuery = `
				(
					HV.SoCMT LIKE '%${name}%'
					OR HV.MaDK LIKE '%${name}%'
				)`
		} else {
			//là chuỗi
			if (name.includes('-')) {
				optionQuery = `
					(
						HV.MaDK like N'%${name}%'
					)`
			} else {
				optionQuery = `
					(
						dbo.GetEcoString(HoTen) like N'%${name}%'
					)`
			}
		}
		// Truy vấn dữ liệu
		console.log('check option', optionQuery)
		const result = await request.query(`select *
		FROM HocVienTH AS HV
		WHERE 
			${optionQuery}
			`);

		// Xử lý kết quả truy vấn tại đây
		// Đóng kết nối
		if (connection) {
			try {
				await connection.close();
				return ({
					EM: "Truy vấn thành công",
					EC: 0,
					DT: result.recordset,
				})
			} catch (err) {
				return ({
					EM: "Truy vấn thất bại",
					EC: 1,
					DT: [],
				})
			}
		}

	} catch (err) {
		console.log('check err', err)
		return ({
			EM: "Truy vấn thất bại",
			EC: -1,
			DT: [],
		})
	}
}

const getAllImageFromNumberCar = async (car, date) => {
  let connection;
  try {
    // Kết nối tới SQL Server
    connection = await sql.connect(constant.config);

    // Tạo một request để thực hiện truy vấn
    const request = new sql.Request();

    // Truy vấn dữ liệu
    const result =
      await request.query(`select ht.MaDK, hv.srcAvatar, dbo.GetEcoString(hv.HoTen) as HotenHV, dbo.GetEcoString(gv.HoTen) as HotenGV, ht.BienSo, TimeSendCenter, ht.ThoiDiemDangNhap, ht.ThoiDiemDangXuat, dbo.GetEcoString(ht.TongQuangDuong) as TongQuangDuong , cast (dbo.GetEcoString(ht.TongThoiGian) as float)/3600 as TongThoiGian ,  ht.SessionId 
      from HanhTrinhTuEtm ht
          left join HocVienTH hv on hv.MaDK = ht.MaDK
          left join KhoaHoc kh on  kh.ID = hv.IDKhoaHoc 
          left join GiaoVienTH gv on gv.MaGV = ht.IDGV
      where  ht.BienSo = '${car}' and CAST (TimeSendCenter AS DATE) = '${date}'
      order by TimeSendCenter desc`);

    // Xử lý kết quả truy vấn tại đây
    // Đóng kết nối
    if (connection) {
      try {
        console.log('check result',result.recordset )
        if (result.recordset.length > 0) {
          const data = await Promise.all(
            result.recordset.map(async (e) => {
              const arrImage = await request.query(
                `select ID, RIGHT(dbo.GetEcoString(SrcHV), LEN(dbo.GetEcoString(SrcHV)) - 24) as LinkHA from AnhHanhTrinh where SessionId = '${e.SessionId}'`
              );
              return {
                ...e,
                linkData:  arrImage?.recordset?.slice(1,-1),
              };
            })
          );
          await connection.close();
          console.log('check data', data)
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

const getImageForStudent = async (mhv, date = null) => {
  let connection;
  try {
    // Kết nối tới SQL Server
    connection = await sql.connect(constant.config);

    // Tạo một request để thực hiện truy vấn
    const request = new sql.Request();
    const addQuerryDate = date ? ` AND CAST (TimeSendCenter AS DATE) = '${date}'`:'';
    // Truy vấn dữ liệu
    const result =
      await request.query(`select  ht.MaDK, hv.srcAvatar, dbo.GetEcoString(hv.HoTen) as HotenHV, dbo.GetEcoString(gv.HoTen) as HotenGV, ht.BienSo, TimeSendCenter, ht.ThoiDiemDangNhap, ht.ThoiDiemDangXuat, dbo.GetEcoString(ht.TongQuangDuong) as TongQuangDuong , cast (dbo.GetEcoString(ht.TongThoiGian) as float)/3600 as TongThoiGian ,  ht.SessionId 
      from HanhTrinhTuEtm ht
          left join HocVienTH hv on hv.MaDK = ht.MaDK
          left join KhoaHoc kh on  kh.ID = hv.IDKhoaHoc 
          left join GiaoVienTH gv on gv.MaGV = ht.IDGV
          where  hv.MaDK = '${mhv}' ${addQuerryDate}
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
  getInfoStudent,
  getAllImageFromNumberCar,
  getImageForStudent
};
