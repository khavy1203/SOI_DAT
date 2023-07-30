const dotenv = require('dotenv');
const https = require('https');
const axios = require('axios');
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const moment = require('moment');
import constant from '../constant/constant';
const XLSX = require('xlsx');
const sql = require('mssql');

const pathFolderFileExcels = path.join(__dirname + '..\\..\\') + "fileExcels";

function checkValueType(value) {
	if (!isNaN(value)) {
		return true;
	} else {
		return false;
	}

}

const apiTest = async (id) => {
	try {
		const user = await db.apiTest.findOne({ where: { id: id } });

		if (user) {
			await user.destroy();
			return {
				EM: " apiTest successfully",
				EC: "0",
				DT: [],
			};
		} else {
			return {
				EM: "No user find",
				EC: "1",
				DT: [],
			};
		}
	} catch (e) {
		console.log("error from service apiTest : >>>", e);
		return {
			EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
			EC: "-2",
			DT: "",
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
		const result = await request.query(`SELECT TOP(10) HV.MaDK,dbo.GetEcoString(HV.HoTen) as HoTen,HV.NgaySinh,HV.SoCMT,HV.srcAvatar,HV.IDKhoaHoc,HV.HangDaoTao,HV.MaKhoaHoc,HV.IsSend, KH.Ten as TenKhoaHoc,
		COALESCE(SUM(CAST(ISNULL(dbo.GetEcoString(HTHV.TongQuangDuong), 0) AS FLOAT)), 0) AS TongQuangDuong,	
		CAST(COALESCE(
			SUM(
				CASE
					WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) THEN
							--DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
							dbo.GetEcoString(HTHV.TongThoiGian)
					ELSE 0
				END
		--), 0 ) as float)/60 AS TongThoiGian,
		), 0 ) as float)/3600 AS TongThoiGian,
		CAST(COALESCE(
			SUM(
				CASE
					WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) AND (HTHV.BienSo  NOT IN ('77A00475', '77A17946','77A21542','77A17922','78A11051','77A11541','77A24156','77A15491','77A07350','78A10137','77A18246') AND HV.HangDaoTao != 'B11') OR HV.HangDaoTao = 'B11'  THEN
						CASE
							WHEN CONVERT(DATE, HTHV.ThoiDiemDangNhap) = CONVERT(DATE, HTHV.ThoiDiemDangXuat) THEN
								CASE
									WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) >= 18 THEN
										DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
									WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) < 18 AND DATEPART(HOUR, HTHV.ThoiDiemDangXuat) >= 18 THEN
										DATEDIFF(MINUTE, CONVERT(DATETIME, CONVERT(VARCHAR(10), HTHV.ThoiDiemDangNhap, 120) + ' 18:00:00'), HTHV.ThoiDiemDangXuat)
									ELSE 0
								END
							ELSE
								DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, CONVERT(DATETIME, CONVERT(VARCHAR(10), DATEADD(DAY, 1, HTHV.ThoiDiemDangNhap), 120) + ' 00:00:00'))
						END 
					ELSE 0
				END
		), 0 ) as float)/60 AS TongThoiGianBanDem,
			CAST(COALESCE(
				SUM(
					CASE
						WHEN HTHV.BienSo IN ('77A00475', '77A17946','77A21542','77A17922','78A11051','77A11541','77A24156','77A15491','77A07350','78A10137','77A18246') AND (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL) THEN						
							CASE
								WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) < 18  THEN
									DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
								WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) < 18 AND DATEPART(HOUR, HTHV.ThoiDiemDangXuat) >= 18 THEN
									DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, CONVERT(DATETIME, CONVERT(VARCHAR(10), HTHV.ThoiDiemDangXuat, 120) + ' 18:00:00', 120))
								ELSE 0
							END
						ELSE 0
					END
				), 0) AS FLOAT
			) / 60 AS TongThoiGianChayXeTuDong,
			CAST(COALESCE(
				SUM(
					CASE
						WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) AND HTHV.BienSo IN ('77A00475', '77A17946','77A21542','77A17922','78A11051','77A11541','77A24156','77A15491','77A07350','78A10137','77A18246') OR HV.HangDaoTao = 'B11'  THEN
							CASE
								WHEN CONVERT(DATE, HTHV.ThoiDiemDangNhap) = CONVERT(DATE, HTHV.ThoiDiemDangXuat) THEN
									CASE
										WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) >= 18 THEN
											DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
										WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) < 18 AND DATEPART(HOUR, HTHV.ThoiDiemDangXuat) >= 18 THEN
											DATEDIFF(MINUTE, CONVERT(DATETIME, CONVERT(VARCHAR(10), HTHV.ThoiDiemDangNhap, 120) + ' 18:00:00'), HTHV.ThoiDiemDangXuat)
										ELSE 0
									END
								ELSE
									DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, CONVERT(DATETIME, CONVERT(VARCHAR(10), DATEADD(DAY, 1, HTHV.ThoiDiemDangNhap), 120) + ' 00:00:00'))
							END 
						ELSE 0
					END
			), 0 ) as float)/60 AS TongThoiGianTuDongChayBanDem,
		ROUND (
			CAST(COALESCE(
				SUM(
					CASE
						--thời điểm đăng nhập lớn hơn thời điểm hiện tại của ngày hôm qua
						WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL )  AND HTHV.ThoiDiemDangNhap > DATEADD(DAY, -1, GETDATE()) THEN
								DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
						WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL )  AND (HTHV.ThoiDiemDangNhap < DATEADD(DAY, -1, GETDATE()) AND HTHV.ThoiDiemDangXuat > DATEADD(DAY, -1, GETDATE())) THEN
								DATEDIFF(MINUTE, DATEADD(DAY, -1, GETDATE()), HTHV.ThoiDiemDangXuat)
						ELSE 0

					END
			), 0 ) as float)/60,2) AS TongThoiGianTrong24h,
			GETDATE() AS ThoiGianHienTai,
			DATEADD(DAY, +1, MAX(HTHV.ThoiDiemDangXuat)) AS ThoiDiemReset
		FROM HocVienTH AS HV
		LEFT JOIN KhoaHoc as KH ON KH.ID = HV.IDKhoaHoc
		JOIN HanhTrinhTuEtm AS HTHV ON HTHV.MaDK = HV.MaDK
		WHERE 
			HTHV.CenterResponseCode in(1,409)
			AND
			${optionQuery}
			GROUP BY HV.MaDK,dbo.GetEcoString(HV.HoTen),HV.NgaySinh,HV.SoCMT,HV.srcAvatar,HV.IDKhoaHoc,HV.HangDaoTao,HV.MaKhoaHoc,HV.IsSend, KH.Ten
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

const getSessionStudent = async (token = null, name) => {
	try {
		return new Promise((resolve, reject) => {

			const yourBearToken = token ? token : process.env.tokenNLTB;
			const today = new Date();
			// Lấy ngày 15 ngày trước
			const before15Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
			// Format ngày dưới dạng ISO-8601
			const before15DaysIoString = before15Days.toISOString();
			const todayIsoString = today.toISOString();
			console.log("check todayIsoString", todayIsoString);
			console.log("check before15DaysIoString", before15DaysIoString);

			const payload = {
				administrativeUnitId: 35,
				centerId: 52001,
				courseTypeId: 0,
				driverLicenseLevelName: null,
				eventReloadName: null,
				fromDate: before15DaysIoString,
				keyword: null,
				processed: 1,
				providerId: 0,
				qualifiedYn: null,
				searchString: name,
				status: 1,
				timeFrom: before15DaysIoString,
				timeTo: todayIsoString,
				toDate: todayIsoString
			}
			const params = new URLSearchParams();
			params.append('page', 0);
			params.append('size', 10);

			//1 nốt bay màu SSL =))
			let dataArr = [];
			const options = {
				hostname: process.env.hostnameNLTB,
				port: 443,
				path: '/api/session-data/search-report-session-data-reports?' + params.toString(),
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + yourBearToken
				},
				rejectUnauthorized: false // Set rejectUnauthorized to false
			};

			const req = https.request(options, (res) => {
				// console.log(`statusCode: ${res.statusCode}`);

				if (res.statusCode != 200) {
					reject({
						EM: "Sever đang bảo trì vui lòng truy cập tính năng lại sau ......",
						EC: -1,
						DT: [],
					});
				};

				const contentType = res.headers['content-type'];
				if (!/^application\/json/.test(contentType)) {
					console.log(`Invalid content type. Expected application/json but received ${contentType}`);
					reject({
						EM: "Invalid content type",
						EC: -3,
						DT: [],
					});
				}

				res.on('data', (d) => {
					//   let data = process.stdout.write(d);
					dataArr.push(d);
				});

				res.on('end', () => {

					let data = {};
					try {
						if (dataArr.length > 0) {
							let dataBuffer = Buffer.concat(dataArr);
							data = JSON.parse(dataBuffer.toString());
							console.log('check data Phiên: ' + data);
							data.forEach(obj => {
								for (let key in obj) {
									if (obj[key] == null || obj[key] == 0) delete obj[key];
								}
							})
						}
					} catch (error) {
						reject({
							EM: "vui lòng thử lại sau ...",
							EC: -1,
							DT: [],
						});
					}

					resolve({
						EM: "Get data successfully",
						EC: 0,
						DT: data,
					});
				});

			});

			req.on('error', (error) => {
				console.log("check error Phien: " + error)
				reject({
					EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
					EC: -2,
					DT: "",
				});
			});

			req.write(JSON.stringify(payload));
			req.end();
		});
	} catch (error) {
		reject({
			EM: "Sever đang bảo trì vui lòng truy cập tính năng lại sau ......",
			EC: -2,
			DT: [],
		});
	}


}


const getTokenService = async () => {
	try {
		return new Promise((resolve, reject) => {
			const payload = {
				username: process.env.usernameNLTB,
				password: process.env.passwordNLTB,
				rememberMe: true,
				responseCaptcha: 'hTaTorNY145de0BdEfdhuA==',
				userCaptcha: '',
			}

			let dataArr = [];

			const options = {
				hostname: process.env.hostnameNLTB,
				port: 443,
				path: '/api/authenticate',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Cookie': '_gid=GA1.3.587322599.1682866862; _gat_gtag_UA_235995231_1=1; _ga_XPNFBH5L32=GS1.1.1682866861.22.1.1682866900.0.0.0; _ga_KSJYQ8K5LK=GS1.1.1682866862.19.1.1682866900.0.0.0; _ga=GA1.3.790826531.1681994975'
				},
				rejectUnauthorized: false // Set rejectUnauthorized to false
			};

			const req = https.request(options, (res) => {
				console.log(`statusCode: ${res.statusCode}`);
				if (res.statusCode != 200) {
					reject({
						EM: "Sever đang bảo trì vui lòng truy cập tính năng lại sau ......",
						EC: -1,
						DT: [],
					});
				};

				const contentType = res.headers['content-type'];
				if (!/^application\/json/.test(contentType)) {
					console.log(`Invalid content type. Expected application/json but received ${contentType}`);
					reject({
						EM: "Invalid content type",
						EC: -3,
						DT: [],
					});
				}

				res.on('data', (d) => {
					dataArr.push(d);
				});

				res.on('end', () => {
					let data = [];
					try {
						if (dataArr.length > 0) {
							let dataBuffer = Buffer.concat(dataArr);
							data = JSON.parse(dataBuffer.toString());
						}
					} catch (error) {
						reject({
							EM: "Sever đang bảo trì vui lòng truy cập tính năng lại sau ......",
							EC: -1,
							DT: [],
						});
					}


					console.log("check data", data)
					resolve({
						EM: "Get data successfully",
						EC: 0,
						DT: data,
					});
				});

			});

			req.on('error', (error) => {
				console.log("check error: " + error)
				reject({
					EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
					EC: -2,
					DT: "",
				});
			});

			req.write(JSON.stringify(payload));
			req.end();
		});
	} catch (e) {
		reject({
			EM: "Sever đang bảo trì vui lòng truy cập tính năng lại sau ......",
			EC: -2,
			DT: [],
		});
	}

}

const checkTokenService = async (req, res) => {
	try {
		return new Promise((resolve, reject) => {
			dotenv.config();
			const yourBearToken = process.env.tokenNLTB;
			console.log("check process.env.tokenNLTB...................", process.env.tokenNLTB)
			let dataArr = [];

			const options = {
				hostname: process.env.hostnameNLTB,
				port: 443,
				path: '/api/centers/getListCenterByUser',
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + yourBearToken
				},
				rejectUnauthorized: false // Set rejectUnauthorized to false
			};

			const req = https.request(options, (res) => {
				console.log(`statusCode: ${res.statusCode}`);
				console.log(`statusCode: ${res.statusCode}`);
				if (res.statusCode != 200) {
					resolve({
						EM: "Sever đang bảo trì vui lòng truy cập tính năng lại sau ......",
						EC: -1,
						DT: [],
					});
				};
				const contentType = res.headers['content-type'];
				if (!/^application\/json/.test(contentType)) {
					console.log(`Invalid content type. Expected application/json but received ${contentType}`);
					reject({
						EM: "Invalid content type",
						EC: -3,
						DT: [],
					});
				}
				res.on('data', (d) => {
					dataArr.push(d);
				});

				res.on('end', () => {
					let dataBuffer = [];
					let data = {};
					try {
						dataBuffer = Buffer.concat(dataArr);
						data = JSON.parse(dataBuffer.toString());
						console.log("check data", data)

					} catch (error) {
						reject({
							EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
							EC: -2,
							DT: "",
						});
					}

					resolve({
						EM: "Get data successfully",
						EC: 0,
						DT: data,
					});
				});

			});

			req.on('error', (error) => {
				console.log("check error: " + error)
				reject({
					EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
					EC: -2,
					DT: "",
				});
			});

			// req.write(JSON.stringify(payload));
			req.end();
		});
	} catch (e) {
		reject({
			EM: "Sever đang bảo trì vui lòng truy cập tính năng lại sau ......",
			EC: -2,
			DT: [],
		});
	}
}

function diff_hours(dt2, dt1) 
 {

  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= (60 * 60);
  return Math.abs(Math.round(diff));
  
 }

const checkSession = async (tokenLocalNLTB = null, mhv) => {
	try {
		return new Promise((resolve, reject) => {

			const yourBearToken = tokenLocalNLTB ? tokenLocalNLTB : process.env.tokenLocalNLTB;
			const today = new Date();
			// Lấy ngày 15 ngày trước
			const todaySum2 = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
			const before15Days = new Date(todaySum2.getTime() - 37 * 24 * 60 * 60 * 1000);
			// Format ngày dưới dạng ISO-8601
			const before15DaysIoString = before15Days.toISOString();
			const todayIsoString = todaySum2.toISOString();
			console.log("check todayIsoString dưới local", todayIsoString);
			console.log("check before15DaysIoString dưới local", before15DaysIoString);

			const params = new URLSearchParams();
			params.append('ten', mhv?.trim());
			params.append('page', 1);
			params.append('limit', 10);
			console.log("check mhv", mhv)
			const getSessionStu = axios.create({
				headers: {
					'Authorization': `Bearer ${yourBearToken}`
				}
			})

			getSessionStu.get(process.env.hostnameLocal + '/api/HanhTrinh?' + params.toString())
				.then(async response => {
					if (response.status != 200) {
						resolve({
							EM: "Lỗi api vui lòng thử lại sau ...",
							EC: 2,
							DT: "",
						});
					}
					const dtLocal = response?.data?.Data;
					dtLocal.map(obj => console.log('check (new Date() - new Date(obj.ThoiDiemDangNhap))/60', (new Date() - new Date(obj.ThoiDiemDangNhap))/1000*60*60))
					const filteredArrayNotUpdate = dtLocal.filter(obj => diff_hours(new Date() , new Date(obj.ThoiDiemDangNhap)) <4);
					console.log('check filteredArrayNotUpdate', filteredArrayNotUpdate)
					if (filteredArrayNotUpdate.length > 0) {

						const payload = {
							"Data": filteredArrayNotUpdate,
							"total_count": filteredArrayNotUpdate.length
						}
						console.log("check playload", payload)
						await getSessionStu.post(process.env.hostnameLocal + '/api/HanhTrinh', payload)
							.then(response => {
								console.log("check response cập nhật lại các phiên mất", response?.status)
								console.log("check response data cập nhật lại các phiên mất", response?.data)

								return response.status;
							})
						resolve({
							EM: `<b>Thực hiện đẩy ${filteredArrayNotUpdate.length} phiên cách đây 4 giờ. 🐧🐧🐧</b> \n`,
							EC: 0,
							DT: [],
						});
					} else {
						resolve({
							EM: "<b>Trong 4 giờ trước không có phiên nào</b> \n",
							EC: 1,
							DT: [],
						});
					}
				})
				.catch(error => {
					reject({
						EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
						EC: -2,
						DT: "",
					});
					console.error(error);
				});


		});
	} catch (error) {
		return ({
			EM: "Sever đang bảo trì vui lòng truy cập tính năng lại sau ......",
			EC: -2,
			DT: [],
		});
	}
}

let listXe = [];
let listKhoa = [];

const inDat = async (tokenLocalNLTB = null, bienso, soThang = 1) => {
	try {
		return new Promise(async (resolve, reject) => {
			const yourBearToken = tokenLocalNLTB ? tokenLocalNLTB : process.env.tokenLocalNLTB;

			const getSessionStu = axios.create({
				baseURL: process.env.hostnameLocal,
				headers: {
					'Authorization': `Bearer ${yourBearToken}`
				},
			})

			if (!listXe?.length) {

				const res = await getSessionStu.get(`/api/xe`)
					.then(response => {
						console.log("check response", response.status)
						if (response.status != 200) {
							return ({
								EM: "Lỗi api ...",
								EC: 1,
								DT: "",
							});
						}
						if (response?.data?.total_count) {
							listXe = response?.data?.Data
							return ({
								EM: "Add Xe success",
								EC: 0,
								DT: "",
							});
						}
					})
					.catch(error => {
						console.log("check error", error)
						return ({
							EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
							EC: -2,
							DT: "",
						});
					});
				if (res.EC != 0) resolve({
					EM: "Lỗi truy vấn lấy dữ liệu từ xe",
					EC: 1,
					DT: "",
				});
			}
			if (listXe.length > 0) {
				const objXe = listXe.filter(obj => obj.BienSo == bienso);
				if (objXe.length > 0) {
					console.log('check Xe', objXe[0])

					const params = new URLSearchParams();
					params.append('_idxe', objXe[0].ID);
					const today = new Date();
					// Lấy ngày 15 ngày trước
					const todaySum2 = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
					const before15Days = new Date(todaySum2.getTime() - soThang * 30 * 24 * 60 * 60 * 1000);
					// Format ngày dưới dạng ISO-8601
					const before15DaysIoString = before15Days.toISOString().slice(0, 10);
					const todayIsoString = todaySum2.toISOString().slice(0, 10);
					console.log("check todayIsoString dưới local", todayIsoString);
					console.log("check before15DaysIoString dưới local", before15DaysIoString);

					params.append('_ngaybatdau', before15DaysIoString);
					params.append('_ngayketthuc', todayIsoString);

					await getSessionStu.get('/api/ReportCar/?' + params.toString(), { responseType: 'stream' })
						.then(response => {
							console.log('check response', response.status)
							if (response.status != 200) {
								reject({
									EM: "Lỗi api ...",
									EC: 1,
									DT: "",
								});
							}
							console.log("check response.data", response.data)

							const pathFolderPdf = path.join(__dirname + '..\\..\\') + "filesPDF\\inDat\\" + bienso + ".pdf";
							console.log("check path: " + pathFolderPdf)
							const writeStream = fs.createWriteStream(pathFolderPdf);
							response.data.pipe(writeStream);

							writeStream.on('finish', async () => {
								console.log("check finish")
								resolve({
									EM: "Get data successfully",
									EC: 0,
									DT: pathFolderPdf,
								})
							})

						})
						.catch(error => {
							reject({
								EM: "Lỗi api ...",
								EC: -2,
								DT: "",
							});
						});

				} else {
					//không có xe
					resolve({
						EM: "<b>Không có xe này</b>",
						EC: 1,
						DT: ""
					});
				}
			}
		})


	} catch (error) {
		console.log('check error', error)
		return ({
			EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
			EC: -2,
			DT: "",
		});
	}
}

const pushSource = async (tokenLocalNLTB = null, khoa, bienso) => {
	try {
		return new Promise(async (resolve, reject) => {
			const yourBearToken = tokenLocalNLTB ? tokenLocalNLTB : process.env.tokenLocalNLTB;

			const getSessionStu = axios.create({
				baseURL: process.env.hostnameLocal,
				headers: {
					'Authorization': `Bearer ${yourBearToken}`
				},
			})

			if (!listXe?.length || !listKhoa?.length) {

				const res1 = await getSessionStu.get(`/api/xe`);

				const res2 = await getSessionStu.get(`/api/course`);

				const pr = await Promise.all([res1, res2])
					.then(response => {
						if (response[0].status != 200 || response[1].status != 200) {
							return ({
								EM: "Lỗi api ...",
								EC: -2,
								DT: "",
							});
						}
						console.log("check response[0]?.data?.total_count", response[0]?.data?.total_count)
						console.log("response[1]?.data?.total_count", response[1]?.data?.x_total_count)

						if (response[0]?.data?.total_count && response[1]?.data?.x_total_count) {
							listXe = response[0]?.data?.Data;
							listKhoa = response[1]?.data?.Data;
							return ({
								EM: "Add success",
								EC: 0,
								DT: "",
							});
						} else {
							return ({
								EM: "Lỗi api ...",
								EC: 1,
								DT: "",
							});
						}

					})
					.catch(error => {
						console.log("check error", error)
						return ({
							EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
							EC: -2,
							DT: "",
						});
					});
				console.log("check pr", pr)
				if (pr.EC != 0) resolve({
					EM: `<b>Lỗi truy vấn lấy khoá và xe</b>`,
					EC: 1,
					DT: ""
				});
			}
			console.log("check list xe", listXe.length)
			console.log("check list khoa", listKhoa.length)
			if (listXe.length > 0 && listKhoa.length > 0) {
				const objXe = listXe.filter(obj => obj.BienSo == bienso?.trim());
				const objSource = listKhoa.filter(obj => obj.Ten.includes(khoa));
				console.log("check objXe", objXe)
				console.log("check objSource", objSource)

				if (!objSource.length) resolve({
					EM: `<b>Không có Khoá ${khoa} này</b>`,
					EC: 1,
					DT: ""
				});
				if (!objXe.length) resolve({
					EM: `<b>Không có Xe ${bienso} này</b>`,
					EC: 1,
					DT: ""
				});
				if (objSource.length && objXe.length) {
					console.log('check Xe', objXe)
					console.log('check Khoá', objSource)

					const params = new URLSearchParams();
					params.append('dsBienSo', objXe[0]?.BienSo);
					params.append('idkhoahoc', objSource[0]?.ID);

					if (constant.listCourseOld.some(obj => obj == objSource[0]?.Ten)) {
						params.append('dsMaDk', "");

					} else {
						let pathFileExcels = "";
						//lấy danh sách học viên và đẩy theo khoá đó
						const pr1 = await new Promise(async (resolve, reject) => {
							fs.readdir(pathFolderFileExcels, async (err, files) => {
								if (err) {
									console.log('Lỗi khi đọc thư mục:', err);
									reject({
										EM: "Lỗi api ...",
										EC: -2,
										DT: "",
									});
								}

								files.forEach(file => {
									const fileName = path.basename(file,path.extname(file));
									console.log("cheeck fileName", fileName)
									console.log('check objSource[0]?.Ten.includes', objSource[0]?.Ten)
									console.log("check objSource[0]?.Ten.includes(fileName)", objSource[0]?.Ten.includes(fileName))
									if (fileName.includes(objSource[0]?.Ten))  {
										pathFileExcels = path.join(pathFolderFileExcels, file)
										console.log("check pathFileExcels2", pathFileExcels)
										resolve(true)
									}
									console.log(fileName);
								});
								resolve(false)
							});
						})
						if (!pr1) resolve({
							EM: `Tìm kiếm file dữ liệu khoá ${objSource[0]?.Ten} không tồn tại. Vui lòng liên hệ Em Vy để được add vào ạ`,
							EC: 1,
							DT: "",
						})
						console.log("check pathFileExcels1", pathFileExcels)
						console.log('check pr1', pr1)
						if (pathFileExcels) {
							console.log("chekc pathFileExcels", pathFileExcels)
							const lstStudentAdd = [];
							const workbook = XLSX.readFile(pathFileExcels);
							console.log('check workbook', workbook)
							const sheetName = workbook.SheetNames[0]; // Lấy tên của sheet đầu tiên
							console.log('check workbook', sheetName)

							const worksheet = workbook.Sheets[sheetName];
							const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
							console.log('check data', data)
							console.log('check data.length', data.length)
							await data.map(async (e) => {
								console.log('check e in data', e)
								if (e.length > 0) {
									console.log("check result", e[0])
									if (e[1] && e[1].toString().trim().toLowerCase() == 'true')
										lstStudentAdd?.push(e[0].trim());
								}
							})
							console.log("check lstStudentAdd", lstStudentAdd)
							if (lstStudentAdd.length > 0) {
								//call api
								console.log("check lstStudentAdd.join(", ")", lstStudentAdd.join(","))
								params.append('dsMaDk', lstStudentAdd.join(","));
							} else {
								resolve({
									EM: `File dữ liệu thông tin khoá ${objSource[0]?.Ten} trống. Vui lòng liên hệ Em Vy ạ`,
									EC: 1,
									DT: "",
								})
							}
						} else {
							resolve({
								EM: `File dữ liệu thông tin khoá ${objSource[0]?.Ten} chưa được cập nhật. Vui lòng liên hệ Em Vy ạ`,
								EC: 1,
								DT: "",
							})
						}

					}
					console.log("về bờ")
					await getSessionStu.get('/api/xe/?' + params.toString())
						.then(response => {
							console.log('check response đẩy khoá', response.status)
							if (response.status != 200) {
								reject({
									EM: "Lỗi api ...",
									EC: 1,
									DT: "",
								});
							}
							if (response?.data) {
								console.log("check response", response)
								resolve({
									EM: `<b>Đẩy khoá học ${objSource[0].Ten} xuống xe ${objXe[0].BienSo} thành công</b>`,
									EC: 0,
									DT: "",
								})
							} else {
								console.log("check response", response)
								resolve({
									EM: `<b>Đẩy khoá học ${objSource[0].Ten} xuống xe ${objXe[0].BienSo} thất bại</b>`,
									EC: 1,
									DT: "",
								})
							}

						})
						.catch(error => {
							console.log("check error", error)
							reject({
								EM: "Lỗi api ...",
								EC: 1,
								DT: "",
							});
						});

				}

			}

		});


	} catch (error) {
		console.log('check error', error)
		return ({
			EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
			EC: -2,
			DT: "",
		});
	}
}

const searchSource = async (tokenLocalNLTB = null, khoa) => {
	try {
		return new Promise(async (resolve, reject) => {
			const yourBearToken = tokenLocalNLTB ? tokenLocalNLTB : process.env.tokenLocalNLTB;

			const getSessionStu = axios.create({
				baseURL: process.env.hostnameLocal,
				headers: {
					'Authorization': `Bearer ${yourBearToken}`
				},
			})

			if (!listKhoa?.length) {

				const res2 = getSessionStu.get(`/api/course`);

				const pr = await Promise.all([res2])
					.then(response => {
						if (response[0].status != 200) {
							return ({
								EM: "Lỗi api ...",
								EC: -2,
								DT: "",
							});
						}
						console.log("check response[0]?.data?.total_count", response[0]?.data?.x_total_count)

						if (response[0]?.data?.x_total_count) {
							listKhoa = response[0]?.data?.Data;
							return ({
								EM: "Add success",
								EC: 0,
								DT: "",
							});
						} else {
							return ({
								EM: "Lỗi api ...",
								EC: 1,
								DT: "",
							});
						}

					})
					.catch(error => {
						console.log("check error", error)
						return ({
							EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
							EC: -2,
							DT: "",
						});
					});
				console.log("check pr", pr)
				if (pr.EC != 0) resolve({
					EM: `<b>Lỗi truy vấn lấy khoá</b>`,
					EC: 1,
					DT: ""
				});
			}
			console.log("check list khoa", listKhoa.length)
			if (listKhoa.length > 0) {
				const objSource = listKhoa.filter(obj => obj.Ten.includes(khoa));
				console.log("check objSource", objSource)

				if (!objSource.length) resolve({
					EM: `<b>Không có Khoá ${khoa} này</b>`,
					EC: 1,
					DT: ""
				});
				const lstObjSource = objSource.map(e => e.Ten).join(', ');
				resolve({
					EM: `<b>Tìm thấy danh sách khoá</b> \n ${lstObjSource}`,
					EC: 0,
					DT: objSource
				});

			}
		});


	} catch (error) {
		console.log('check error', error)
		return ({
			EM: "Sever đang bảo trì, vui long truy cập lại sau ... ...",
			EC: -2,
			DT: "",
		});
	}
}

const testform = async (name) => {
	let connection;
	try {
		// Kết nối tới SQL Server
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
		const result = await request.query(`SELECT ID
		,MaDK
		,Imei
		,IDGV
		,dbo.GetEcoString(TongThoiGian) as TongThoiGian
		,dbo.GetEcoString(TongQuangDuong) as TongQuangDuong
		,ThoiDiemDangNhap
		,ThoiDiemDangXuat
		,StartLongitude
		,StartLatitude
		,EndLongitude
		,EndLatitude
		,CreatedDate
		,IsActived
		,SyscImeis
		,EtmTripId
		,BienSo
		,SessionId
		,TimeSendCenter
		,CenterResponseMessage
		,SuccessSendToCenter
		,CenterResponseCode
		,CurentIdTrip
		,Vbx
		,Note
	  FROM [dbo].[HanhTrinhTuEtm] WHERE MaDK ='${name}'`);

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

const getInfoStudentOnCource = async (course) => {
	let connection;
	try {
		// Kết nối tới SQL Server
		connection = await sql.connect(constant.config);
		console.log('Connected to SQL Server');

		// Tạo một request để thực hiện truy vấn
		const request = new sql.Request();
		let optionQuery = `HV.MaKhoaHoc = '${course}'`;

		// Truy vấn dữ liệu
		console.log('check option', optionQuery)
		const result = await request.query(`SELECT HV.MaDK,dbo.GetEcoString(HV.HoTen) as HoTen,HV.NgaySinh,HV.SoCMT,HV.srcAvatar,HV.IDKhoaHoc,HV.HangDaoTao,HV.MaKhoaHoc,HV.IsSend, HV.MaKhoaHoc as MaKhoaHoc,
		ROUND (COALESCE(SUM(CAST(ISNULL(dbo.GetEcoString(HTHV.TongQuangDuong), 0) AS FLOAT)), 0),2) AS TongQuangDuong,
		ROUND (
		CAST(COALESCE(
			SUM(
				CASE
					WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) THEN
							--DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
							dbo.GetEcoString(HTHV.TongThoiGian)
					ELSE 0
				END
		--), 0 ) as float)/60,2) AS TongThoiGian,
		), 0 ) as float)/3600,2) AS TongThoiGian,
		ROUND (
		CAST(COALESCE(
			SUM(
				CASE
					WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) AND (HTHV.BienSo  NOT IN ('77A00475', '77A17946','77A21542','77A17922','78A11051','77A11541','77A24156','77A15491','77A07350','78A10137','77A18246') AND HV.HangDaoTao != 'B11') OR HV.HangDaoTao = 'B11'  THEN
						CASE
							WHEN CONVERT(DATE, HTHV.ThoiDiemDangNhap) = CONVERT(DATE, HTHV.ThoiDiemDangXuat) THEN
								CASE
									WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) >= 18 THEN
										DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
									WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) < 18 AND DATEPART(HOUR, HTHV.ThoiDiemDangXuat) >= 18 THEN
										DATEDIFF(MINUTE, CONVERT(DATETIME, CONVERT(VARCHAR(10), HTHV.ThoiDiemDangNhap, 120) + ' 18:00:00'), HTHV.ThoiDiemDangXuat)
									ELSE 0
								END
							ELSE
								DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, CONVERT(DATETIME, CONVERT(VARCHAR(10), DATEADD(DAY, 1, HTHV.ThoiDiemDangNhap), 120) + ' 00:00:00'))
						END 
					ELSE 0
				END
		), 0 ) as float)/60,2) AS TongThoiGianBanDem,

		ROUND (
		CAST(COALESCE(
			SUM(
				CASE
					WHEN HTHV.BienSo IN ('77A00475', '77A17946','77A21542','77A17922','78A11051','77A11541','77A24156','77A15491','77A07350','78A10137','77A18246')  AND (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) THEN
							DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
					ELSE 0
				END
		), 0 ) as float)/60,2) AS TongThoiGianChayXeTuDong,
		ROUND (
			CAST(COALESCE(
				SUM(
					CASE
						--thời điểm đăng nhập lớn hơn thời điểm hiện tại của ngày hôm qua
						WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL )  AND HTHV.ThoiDiemDangNhap > DATEADD(DAY, -1, GETDATE()) THEN
								DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
						WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL )  AND (HTHV.ThoiDiemDangNhap < DATEADD(DAY, -1, GETDATE()) AND HTHV.ThoiDiemDangXuat > DATEADD(DAY, -1, GETDATE())) THEN
								DATEDIFF(MINUTE, DATEADD(DAY, -1, GETDATE()), HTHV.ThoiDiemDangXuat)
						ELSE 0

					END
			), 0 ) as float)/60,2) AS TongThoiGianTrong24h,
			GETDATE() AS ThoiGianHienTai,
			DATEADD(DAY, +1, MAX(HTHV.ThoiDiemDangXuat)) AS ThoiDiemReset
		FROM HocVienTH AS HV
		LEFT JOIN KhoaHoc as KH ON KH.MaKhoaHoc = HV.MaKhoaHoc
		LEFT JOIN HanhTrinhTuEtm AS HTHV ON HTHV.MaDK = HV.MaDK
		WHERE 
			--HTHV.CenterResponseCode = 1
			--AND
			${optionQuery}
			GROUP BY HV.MaDK,dbo.GetEcoString(HV.HoTen),HV.NgaySinh,HV.SoCMT,HV.srcAvatar,HV.IDKhoaHoc,HV.HangDaoTao,HV.MaKhoaHoc,HV.IsSend, KH.Ten
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

const getInfoStudentOnMHV = async (mhv) => {
	let connection;
	try {
		// Kết nối tới SQL Server
		connection = await sql.connect(constant.config);
		console.log('Connected to SQL Server');

		// Tạo một request để thực hiện truy vấn
		const request = new sql.Request();
		let optionQuery = `HV.MaDK = '${mhv}'`;

		// Truy vấn dữ liệu
		console.log('check option', optionQuery)
		const result = await request.query(`SELECT HV.MaDK,dbo.GetEcoString(HV.HoTen) as HoTen, FORMAT(HV.NgaySinh, 'dd/MM/yyyy') as NgaySinh,HV.SoCMT,HV.srcAvatar,HV.IDKhoaHoc,HV.HangDaoTao,HV.MaKhoaHoc,HV.IsSend, HV.MaKhoaHoc as MaKhoaHoc,
		ROUND (COALESCE(SUM(CAST(ISNULL(dbo.GetEcoString(HTHV.TongQuangDuong), 0) AS FLOAT)), 0),2) AS TongQuangDuong,
		ROUND (
		CAST(COALESCE(
			SUM(
				CASE
					WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) THEN
							--DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
							dbo.GetEcoString(HTHV.TongThoiGian)
					ELSE 0
				END
		--), 0 ) as float)/60,2) AS TongThoiGian,
		), 0 ) as float)/3600,2) AS TongThoiGian,
		ROUND (
		CAST(COALESCE(
			SUM(
				CASE
					WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) AND (HTHV.BienSo  NOT IN ('77A00475', '77A17946','77A21542','77A17922','78A11051','77A11541','77A24156','77A15491','77A07350','78A10137','77A18246') AND HV.HangDaoTao != 'B11') OR HV.HangDaoTao = 'B11'  THEN
						CASE
							WHEN CONVERT(DATE, HTHV.ThoiDiemDangNhap) = CONVERT(DATE, HTHV.ThoiDiemDangXuat) THEN
								CASE
									WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) >= 18 THEN
										DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
									WHEN DATEPART(HOUR, HTHV.ThoiDiemDangNhap) < 18 AND DATEPART(HOUR, HTHV.ThoiDiemDangXuat) >= 18 THEN
										DATEDIFF(MINUTE, CONVERT(DATETIME, CONVERT(VARCHAR(10), HTHV.ThoiDiemDangNhap, 120) + ' 18:00:00'), HTHV.ThoiDiemDangXuat)
									ELSE 0
								END
							ELSE
								DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, CONVERT(DATETIME, CONVERT(VARCHAR(10), DATEADD(DAY, 1, HTHV.ThoiDiemDangNhap), 120) + ' 00:00:00'))
						END 
					ELSE 0
				END
		), 0 ) as float)/60,2) AS TongThoiGianBanDem,

		ROUND (
		CAST(COALESCE(
			SUM(
				CASE
					WHEN HTHV.BienSo IN ('77A00475', '77A17946','77A21542','77A17922','78A11051','77A11541','77A24156','77A15491','77A07350','78A10137','77A18246')  AND (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL ) THEN
							DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
					ELSE 0
				END
		), 0 ) as float)/60,2) AS TongThoiGianChayXeTuDong,
		ROUND (
			CAST(COALESCE(
				SUM(
					CASE
						--thời điểm đăng nhập lớn hơn thời điểm hiện tại của ngày hôm qua
						WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL )  AND HTHV.ThoiDiemDangNhap > DATEADD(DAY, -1, GETDATE()) THEN
								DATEDIFF(MINUTE, HTHV.ThoiDiemDangNhap, HTHV.ThoiDiemDangXuat)
						WHEN (HTHV.ThoiDiemDangNhap IS NOT NULL) AND (HTHV.ThoiDiemDangXuat IS NOT NULL )  AND (HTHV.ThoiDiemDangNhap < DATEADD(DAY, -1, GETDATE()) AND HTHV.ThoiDiemDangXuat > DATEADD(DAY, -1, GETDATE())) THEN
								DATEDIFF(MINUTE, DATEADD(DAY, -1, GETDATE()), HTHV.ThoiDiemDangXuat)
						ELSE 0

					END
			), 0 ) as float)/60,2) AS TongThoiGianTrong24h,
			GETDATE() AS ThoiGianHienTai,
			DATEADD(DAY, +1, MAX(HTHV.ThoiDiemDangXuat)) AS ThoiDiemReset
		FROM HocVienTH AS HV
		LEFT JOIN KhoaHoc as KH ON KH.ID = HV.IDKhoaHoc
		LEFT JOIN HanhTrinhTuEtm AS HTHV ON HTHV.MaDK = HV.MaDK
		WHERE 
			--HTHV.CenterResponseCode = 1
			--AND
			${optionQuery}
			GROUP BY HV.MaDK,dbo.GetEcoString(HV.HoTen),HV.NgaySinh,HV.SoCMT,HV.srcAvatar,HV.IDKhoaHoc,HV.HangDaoTao,HV.MaKhoaHoc,HV.IsSend, KH.Ten
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



module.exports = {
	pushSource,
	getInfoStudent,
	getSessionStudent,
	getTokenService,
	checkTokenService,
	checkSession,
	inDat,
	searchSource,
	testform,
	getInfoStudentOnCource,
	getInfoStudentOnMHV
}