import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx'; // Import thư viện đọc Excel
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { 
  Upload, FileText, Filter, Download, AlertCircle, 
  Truck, Search, Calendar, ChevronLeft, ChevronRight, XCircle, FileWarning, Layers, ClipboardList, TrendingUp, TrendingDown, MinusCircle
} from 'lucide-react';

// --- Cấu hình màu sắc ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#FF6666', '#99CCFF', '#CC99FF'];

// --- Component Card UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, icon: Icon }) => (
  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
    {Icon && <Icon className="w-5 h-5 text-blue-600" />}
    <h3 className="font-semibold text-gray-800">{title}</h3>
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const MainApp = () => {
  // --- Tab State ---
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking' | 'cancellation' | 'inventory'

  // ================= STATE TAB 1: ĐỐI SOÁT =================
  const [inFiles, setInFiles] = useState([]);     
  const [outData, setOutData] = useState([]);     
  const [statusMap, setStatusMap] = useState({ byId: {}, byCode: {} }); 
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [targetYear, setTargetYear] = useState(2026);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCarrier, setFilterCarrier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // ================= STATE TAB 2: BÁO CÁO HỦY =================
  const [cancelData, setCancelData] = useState([]);
  const [filterCancelSku, setFilterCancelSku] = useState('');
  const [filterCancelReason, setFilterCancelReason] = useState('');
  const [cancelPage, setCancelPage] = useState(1);

  // ================= STATE TAB 3: KIỂM KÊ (MỚI) =================
  const [inventoryRawData, setInventoryRawData] = useState([]);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [filterInventorySku, setFilterInventorySku] = useState('');
  const [filterInventoryStatus, setFilterInventoryStatus] = useState(''); // '' | 'excess' | 'missing' | 'exact'

  // ================= LOGIC TAB 1: ĐỐI SOÁT =================
  
  const handleInFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const parsedOrders = [];

    for (const file of files) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });

        workbook.SheetNames.forEach(sheetName => {
          let sheetDate = null;
          const dateMatchPlain = sheetName.match(/^(\d{2})(\d{2})$/);
          const dateMatchSlash = sheetName.match(/(\d{1,2})\/(\d{1,2})/);

          if (dateMatchPlain) {
             const day = dateMatchPlain[1];
             const month = dateMatchPlain[2];
             sheetDate = `${targetYear}-${month}-${day}`;
          } else if (dateMatchSlash) {
            const day = dateMatchSlash[1].padStart(2, '0');
            const month = dateMatchSlash[2].padStart(2, '0');
            sheetDate = `${targetYear}-${month}-${day}`;
          }

          const finalDate = sheetDate || 'Chưa rõ';
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (jsonData.length > 0) {
            let headerRowIndex = -1;
            
            for(let i = 0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i];
                if (!row || !Array.isArray(row)) continue;
                const rowString = JSON.stringify(row).toLowerCase();
                if (rowString.includes('spx') || rowString.includes('ghn') || rowString.includes('j&t') || rowString.includes('grab')) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex !== -1) {
                const headerRow = jsonData[headerRowIndex];
                const carriers = [];

                headerRow.forEach((cell, idx) => {
                  if (!cell || typeof cell !== 'string') return;
                  const cellText = cell.toString().trim().toUpperCase();
                  let carrierName = null;
                  if (cellText.includes('SPX')) carrierName = 'SPX';
                  else if (cellText.includes('GHN')) carrierName = 'GHN';
                  else if (cellText.includes('J&T') || cellText.includes('JT')) carrierName = 'J&T';
                  else if (cellText.includes('VTP') || cellText.includes('VIETTEL')) carrierName = 'Viettel Post';
                  else if (cellText.includes('LAZADA')) carrierName = 'Lazada';
                  else if (cellText.includes('GRAB')) carrierName = 'Grab';
                  else if (cellText.includes('NETPOST')) carrierName = 'Netpost';
                  else if (cellText.includes('HPW')) carrierName = 'HPW';

                  if (carrierName) {
                    carriers.push({ index: idx, name: carrierName });
                  }
                });

                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                  const row = jsonData[i];
                  if (!row) continue;
                  carriers.forEach(carrier => {
                    const rawCode = row[carrier.index];
                    if (rawCode) {
                      const trackingCode = rawCode.toString().trim();
                      if (trackingCode.length > 3 && !trackingCode.toLowerCase().includes('tổng')) { 
                        parsedOrders.push({
                          trackingCode,
                          carrier: carrier.name,
                          originalColumn: headerRow[carrier.index],
                          date: finalDate,
                          sourceFile: `${file.name} - Sheet: ${sheetName}`
                        });
                      }
                    }
                  });
                }
            }
          }
        });
      } catch (error) {
        console.error("Lỗi đọc file:", file.name, error);
      }
    }
    setInFiles(prev => [...prev, ...parsedOrders]);
  };

  const handleOutFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const targetSheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'data') || workbook.SheetNames[0];
      const sheet = workbook.Sheets[targetSheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      let headerIdx = -1;
      let codeIdx = -1;

      for(let i=0; i<Math.min(20, jsonData.length); i++) {
        const row = jsonData[i];
        if (!row || !Array.isArray(row)) continue;
        const idx = row.findIndex(c => c && c.toString().includes('Mã vận đơn'));
        if (idx !== -1) {
          headerIdx = i;
          codeIdx = idx;
          break;
        }
      }

      if (codeIdx === -1) return alert(`Không tìm thấy cột 'Mã vận đơn' trong sheet '${targetSheetName}'`);

      const outSet = new Set();
      for (let i = headerIdx + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        const code = row[codeIdx]?.toString().trim();
        if (code) outSet.add(code);
      }
      setOutData(Array.from(outSet));
    } catch (error) {
      console.error(error);
      alert("Lỗi đọc file Đơn Đi.");
    }
  };

  const handleStatusFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      let headerIdx = -1;
      let codeIdx = -1, statusIdx = -1, customerIdx = -1, productIdx = -1, idIdx = -1, qtyIdx = -1;

      for(let i=0; i<Math.min(20, jsonData.length); i++) {
        const row = jsonData[i];
        if (!row || !Array.isArray(row)) continue;
        const cIdx = row.findIndex(c => c && c.toString().includes('Mã vận đơn'));
        const iIdx = row.findIndex(c => c && c.toString() === 'ID');
        if (cIdx !== -1 || iIdx !== -1) {
          headerIdx = i;
          codeIdx = cIdx;
          idIdx = iIdx;
          statusIdx = row.findIndex(c => c && c.toString().includes('Trạng thái'));
          customerIdx = row.findIndex(c => c && c.toString().includes('Tên khách hàng'));
          productIdx = row.findIndex(c => c && c.toString().includes('Sản phẩm'));
          qtyIdx = row.findIndex(c => c && c.toString().includes('Số lượng'));
          break;
        }
      }

      if (idIdx === -1 && codeIdx === -1) return alert("Không tìm thấy cột Mã vận đơn hoặc ID trong file Trạng thái");

      const byId = {};
      const byCode = {};
      let currentOrder = null;

      const commitOrder = (order) => {
        if (!order) return;
        const productSummary = order.items.map(p => `${p.name} (x${p.qty})`).join(', ');
        const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
        const finalInfo = { ...order, product: productSummary, totalQty: totalQty };
        if (order.id) byId[order.id.toString().trim()] = finalInfo;
        if (order.code) byCode[order.code.toString().trim()] = finalInfo;
      };

      for (let i = headerIdx + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        const rowId = (idIdx !== -1 && row[idIdx]) ? row[idIdx].toString().trim() : '';
        const rowCode = (codeIdx !== -1 && row[codeIdx]) ? row[codeIdx].toString().trim() : '';
        const rowProduct = (productIdx !== -1 && row[productIdx]) ? row[productIdx] : '';
        const rowQty = (qtyIdx !== -1 && row[qtyIdx]) ? parseInt(row[qtyIdx]) || 1 : 1;

        if (rowId) {
            commitOrder(currentOrder);
            currentOrder = {
                id: rowId,
                code: rowCode,
                status: (statusIdx !== -1 && row[statusIdx]) ? row[statusIdx] : 'Không xác định',
                customer: (customerIdx !== -1 && row[customerIdx]) ? row[customerIdx] : '',
                items: [{ name: rowProduct, qty: rowQty }]
            };
        } else if (currentOrder) {
            if (rowProduct) currentOrder.items.push({ name: rowProduct, qty: rowQty });
        }
      }
      commitOrder(currentOrder);
      setStatusMap({ byId, byCode });
    } catch (error) {
      console.error(error);
      alert("Lỗi đọc file Trạng Thái.");
    }
  };

  const reportData = useMemo(() => {
    const filteredIn = inFiles.filter(item => {
      if (item.date === 'Chưa rõ') return false; 
      return item.date >= startDate && item.date <= endDate;
    });
    const outSet = new Set(outData);
    const notShipped = filteredIn.filter(item => !outSet.has(item.trackingCode)).map(item => {
      let info = {};
      const idBasedCarriers = ['HPW', 'Netpost', 'Grab', 'GrabExpress'];
      const carrierCheck = item.carrier ? item.carrier.replace(/\s/g, '') : '';
      const isIdBased = idBasedCarriers.some(c => carrierCheck.toLowerCase().includes(c.toLowerCase()));

      if (isIdBased) info = statusMap.byId[item.trackingCode] || {};
      else info = statusMap.byCode[item.trackingCode] || {};

      return {
        ...item,
        currentStatus: info.status || 'Chưa cập nhật',
        customer: info.customer || '',
        product: info.product || '',
        totalQty: info.totalQty || 0,
        orderId: info.id || '' 
      };
    });

    const carrierStats = {};
    filteredIn.forEach(item => { carrierStats[item.carrier] = (carrierStats[item.carrier] || 0) + 1; });
    const chartData = Object.keys(carrierStats).map(key => ({ name: key, value: carrierStats[key] }));

    const statusStats = {};
    notShipped.forEach(item => { const st = item.currentStatus; statusStats[st] = (statusStats[st] || 0) + 1; });
    const barData = Object.keys(statusStats).map(key => ({ name: key, count: statusStats[key] }));

    return { filteredIn, notShipped, chartData, barData };
  }, [inFiles, outData, statusMap, startDate, endDate]);

  const filteredNotShipped = useMemo(() => {
    return reportData.notShipped.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || item.trackingCode.toLowerCase().includes(searchLower) || (item.orderId && item.orderId.toLowerCase().includes(searchLower));
      const matchDate = !filterDate || item.date === filterDate;
      const matchCarrier = !filterCarrier || item.carrier === filterCarrier;
      const matchStatus = !filterStatus || item.currentStatus === filterStatus;
      return matchSearch && matchDate && matchCarrier && matchStatus;
    });
  }, [reportData.notShipped, searchTerm, filterDate, filterCarrier, filterStatus]);

  const handleExport = () => {
    if (filteredNotShipped.length === 0) return alert("Không có dữ liệu!");
    const ws = XLSX.utils.json_to_sheet(filteredNotShipped.map(item => ({
      'Ngày in': item.date,
      'Mã vận đơn': item.trackingCode,
      'ID tìm thấy': item.orderId,
      'Sản phẩm': item.product,
      'SL': item.totalQty,
      'Trạng thái': item.currentStatus,
      'ĐVVC': item.carrier
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Don_Chua_Di");
    XLSX.writeFile(wb, `Don_Chua_Di_${startDate}_${endDate}.xlsx`);
  };

  // ================= LOGIC TAB 2: BÁO CÁO HỦY SHOPEE =================

  const handleCancellationUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      let headerIdx = -1;
      let orderIdIdx = -1, reasonIdx = -1, skuIdx = -1, qtyIdx = -1;

      // Tìm cột cần thiết
      for(let i=0; i<Math.min(20, jsonData.length); i++) {
        const row = jsonData[i];
        if (!row || !Array.isArray(row)) continue;
        
        const rString = JSON.stringify(row).toLowerCase();
        if (rString.includes('mã đơn hàng') && rString.includes('lý do hủy')) {
          headerIdx = i;
          orderIdIdx = row.findIndex(c => c && c.toString().includes('Mã đơn hàng'));
          reasonIdx = row.findIndex(c => c && c.toString().includes('Lý do hủy'));
          skuIdx = row.findIndex(c => c && c.toString().includes('SKU phân loại hàng'));
          qtyIdx = row.findIndex(c => c && c.toString().includes('Số lượng'));
          break;
        }
      }

      if (headerIdx === -1) return alert("Không tìm thấy header file Hủy.");

      const extracted = [];
      let currentOrderId = null;
      let currentReason = null;

      const excludeReasons = [
        "chưa được thanh toán",
        "giao hàng thất bại",
        "người mua", 
        "khách hàng" 
      ];

      for(let i = headerIdx + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;

        let oId = row[orderIdIdx];
        let reason = row[reasonIdx];
        
        if (oId) {
            currentOrderId = oId;
            currentReason = reason;
        }

        const effectiveOrderId = oId || currentOrderId;
        const effectiveReason = reason || currentReason;

        if (!effectiveOrderId) continue;

        const reasonLower = effectiveReason ? effectiveReason.toString().toLowerCase() : "";
        const isExcluded = excludeReasons.some(excluded => reasonLower.includes(excluded));

        if (isExcluded) continue;

        const sku = row[skuIdx] ? row[skuIdx].toString() : "Không rõ";
        const qty = row[qtyIdx] ? parseInt(row[qtyIdx]) || 0 : 0;

        extracted.push({
          orderId: effectiveOrderId,
          reason: effectiveReason,
          sku: sku,
          qty: qty
        });
      }
      setCancelData(extracted);
    } catch (error) {
      console.error(error);
      alert("Lỗi đọc file Hủy.");
    }
  };

  const cancelReportData = useMemo(() => {
    const filteredDetails = cancelData.filter(item => {
      const matchSku = !filterCancelSku || item.sku.toLowerCase().includes(filterCancelSku.toLowerCase());
      const matchReason = !filterCancelReason || item.reason === filterCancelReason;
      return matchSku && matchReason;
    });

    const skuStats = {};
    cancelData.forEach(item => {
      const s = item.sku || "Không rõ";
      if (!skuStats[s]) {
        skuStats[s] = 0;
      }
      skuStats[s] += item.qty;
    });

    const summaryList = Object.entries(skuStats).map(([sku, totalQty]) => ({
        sku,
        totalQty
    })).sort((a, b) => b.totalQty - a.totalQty);

    const reasonStats = {};
    cancelData.forEach(item => {
      const r = item.reason || "Không rõ";
      if (!reasonStats[r]) {
        reasonStats[r] = { reason: r, orderIds: new Set(), totalQty: 0 };
      }
      reasonStats[r].orderIds.add(item.orderId);
      reasonStats[r].totalQty += item.qty;
    });

    const reasonList = Object.values(reasonStats).map(stat => ({
        reason: stat.reason,
        orderCount: stat.orderIds.size,
        totalQty: stat.totalQty
    })).sort((a, b) => b.orderCount - a.orderCount);

    return { filteredDetails, summaryList, reasonList };
  }, [cancelData, filterCancelSku, filterCancelReason]);

  const handleExportCancel = () => {
    if (cancelReportData.filteredDetails.length === 0) return alert("Không có dữ liệu hủy để xuất");

    const exportRows = [];
    let previousOrderId = null;

    cancelReportData.filteredDetails.forEach(item => {
        const displayOrderId = item.orderId === previousOrderId ? "" : item.orderId;
        
        exportRows.push({
            'Mã đơn hàng': displayOrderId,
            'Lý do hủy': item.reason,
            'SKU phân loại': item.sku,
            'Số lượng': item.qty
        });

        previousOrderId = item.orderId;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Huy");
    XLSX.writeFile(wb, "Bao_Cao_Don_Huy_Shopee.xlsx");
  };

  const totalCancelPages = Math.ceil(cancelReportData.filteredDetails.length / itemsPerPage);
  const currentCancelData = cancelReportData.filteredDetails.slice(
    (cancelPage - 1) * itemsPerPage,
    cancelPage * itemsPerPage
  );

  const uniqueCancelReasons = [...new Set(cancelData.map(i => i.reason))].sort();

  // ================= LOGIC TAB 3: BÁO CÁO KIỂM KÊ (NEW) =================
  const handleInventoryFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newRecords = [];

    for (const file of files) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let headerIdx = -1;
        let dateIdx = -1, skuIdx = -1, diffIdx = -1;

        for(let i=0; i<Math.min(20, jsonData.length); i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row)) continue;
          
          const rString = JSON.stringify(row).toLowerCase();
          if (rString.includes('mã sản phẩm') && rString.includes('thừa thiếu')) {
            headerIdx = i;
            dateIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('ngày'));
            skuIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('mã sản phẩm'));
            diffIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('thừa thiếu'));
            break;
          }
        }

        if (headerIdx === -1 || skuIdx === -1 || diffIdx === -1) {
          console.warn(`File ${file.name} không đúng định dạng kiểm kê.`);
          continue;
        }

        for(let i = headerIdx + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row) continue;

          let rawDate = row[dateIdx];
          let formattedDate = null;

          if (rawDate) {
             if (typeof rawDate === 'number') {
                const dateObj = new Date(Math.round((rawDate - 25569)*86400*1000));
                formattedDate = dateObj.toISOString().split('T')[0];
             } else {
                const parts = rawDate.toString().split('/');
                if (parts.length === 3) {
                   formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                   formattedDate = rawDate.toString(); 
                }
             }
          }

          const sku = row[skuIdx] ? row[skuIdx].toString().trim() : '';
          const diff = row[diffIdx] ? parseInt(row[diffIdx]) || 0 : 0;

          if (sku) {
            newRecords.push({
              date: formattedDate,
              sku: sku,
              diff: diff,
              sourceFile: file.name
            });
          }
        }
      } catch (error) {
        console.error("Lỗi đọc file kiểm kê:", file.name, error);
      }
    }
    setInventoryRawData(prev => [...prev, ...newRecords]);
  };

  // Tính toán Tổng quan (Stats) cho Tab Kiểm Kê
  const inventoryStats = useMemo(() => {
    // 1. Lọc theo ngày
    const filteredRecords = inventoryRawData.filter(item => {
      if (!item.date) return false;
      return item.date >= startDate && item.date <= endDate;
    });

    // 2. Tổng hợp theo SKU (để loại bỏ trùng lặp nếu có logic đó, ở đây cộng dồn)
    const skuMap = {};
    filteredRecords.forEach(item => {
      if (!skuMap[item.sku]) {
        skuMap[item.sku] = 0;
      }
      skuMap[item.sku] += item.diff;
    });

    // 3. Tính toán thống kê
    let excessCount = 0;
    let missingCount = 0;
    let excessQty = 0;
    let missingQty = 0;

    Object.values(skuMap).forEach(diff => {
      if (diff > 0) {
        excessCount++;
        excessQty += diff;
      } else if (diff < 0) {
        missingCount++;
        missingQty += diff; // diff is negative
      }
    });

    return {
      excessCount,
      missingCount,
      excessQty,
      missingQty, // Negative value
      netQty: excessQty + missingQty 
    };
  }, [inventoryRawData, startDate, endDate]);

  const inventoryReportData = useMemo(() => {
    // 1. Lọc theo ngày
    const filteredRecords = inventoryRawData.filter(item => {
      if (!item.date) return false;
      return item.date >= startDate && item.date <= endDate;
    });

    // 2. Tổng hợp theo SKU
    const skuMap = {};

    filteredRecords.forEach(item => {
      if (!skuMap[item.sku]) {
        skuMap[item.sku] = {
          sku: item.sku,
          totalDiff: 0,
          lastDate: item.date
        };
      }
      
      skuMap[item.sku].totalDiff += item.diff;
      
      if (item.date > skuMap[item.sku].lastDate) {
        skuMap[item.sku].lastDate = item.date;
      }
    });

    let reportList = Object.values(skuMap);

    // 3. Lọc theo Search SKU
    if (filterInventorySku) {
      const lowerSearch = filterInventorySku.toLowerCase();
      reportList = reportList.filter(item => item.sku.toLowerCase().includes(lowerSearch));
    }

    // 4. Lọc theo Status (Bộ lọc mới)
    if (filterInventoryStatus) {
      if (filterInventoryStatus === 'excess') {
        reportList = reportList.filter(item => item.totalDiff > 0);
      } else if (filterInventoryStatus === 'missing') {
        reportList = reportList.filter(item => item.totalDiff < 0);
      } else if (filterInventoryStatus === 'exact') {
        reportList = reportList.filter(item => item.totalDiff === 0);
      }
    }

    return reportList.sort((a, b) => a.sku.localeCompare(b.sku));
  }, [inventoryRawData, startDate, endDate, filterInventorySku, filterInventoryStatus]);

  const handleExportInventory = () => {
    if (inventoryReportData.length === 0) return alert("Không có dữ liệu kiểm kê để xuất");

    const exportData = inventoryReportData.map(item => ({
      'Mã sản phẩm': item.sku,
      'Tổng thừa thiếu': item.totalDiff,
      'Ngày kiểm gần nhất': item.lastDate
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Kiem_Ke");
    XLSX.writeFile(wb, `Bao_Cao_Kiem_Ke_${startDate}_${endDate}.xlsx`);
  };

  const totalInventoryPages = Math.ceil(inventoryReportData.length / itemsPerPage);
  const currentInventoryData = inventoryReportData.slice(
    (inventoryPage - 1) * itemsPerPage,
    inventoryPage * itemsPerPage
  );

  // ================= RENDER =================

  const renderTrackingTab = () => (
    <div className="space-y-6">
       {/* Upload Section Tab 1 */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader title="1. Đơn In (Excel)" icon={FileText} />
            <CardContent>
              <p className="text-xs text-gray-500 mb-3">Sheet dạng 0101, 0201...</p>
              <div className="relative group h-32">
                <input type="file" multiple accept=".xlsx,.xls" onChange={handleInFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-blue-50 transition-colors">
                  <Upload className="text-gray-400 w-8 h-8 mb-2" /><span className="text-sm text-blue-600 font-medium">Chọn file Excel</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-blue-600">{inFiles.length}</span> đơn</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader title="2. Đơn Đã Đi" icon={Truck} />
            <CardContent>
              <p className="text-xs text-gray-500 mb-3">Sheet Data</p>
              <div className="relative group h-32">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleOutFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-green-50 transition-colors">
                  <Upload className="text-gray-400 w-8 h-8 mb-2" /><span className="text-sm text-green-600 font-medium">Chọn file Đơn Đi</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-green-600">{outData.length}</span> đơn</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader title="3. Trạng Thái (Nhanh.vn)" icon={Search} />
            <CardContent>
              <p className="text-xs text-gray-500 mb-3">Lấy SP & Trạng thái</p>
              <div className="relative group h-32">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleStatusFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-purple-50 transition-colors">
                  <Upload className="text-gray-400 w-8 h-8 mb-2" /><span className="text-sm text-purple-600 font-medium">Chọn file Trạng Thái</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-purple-600">{Object.keys(statusMap.byId).length + Object.keys(statusMap.byCode).length}</span> mã</div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Analytics Tab 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Số lượng đơn theo ĐVVC (Đơn In)" icon={Filter} />
            <CardContent className="h-80">
              {reportData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    onMouseMove={(state) => setHoveredBarIndex(state.isTooltipActive ? state.activeTooltipIndex : null)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" name="Số lượng đơn" fill="#8884d8">
                      {reportData.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                      <LabelList content={(props) => props.index === hoveredBarIndex ? null : <text x={props.x + props.width / 2} y={props.y} dy={-6} fill="#666" fontSize={12} textAnchor="middle">{props.value}</text>} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400"><AlertCircle className="mb-2" />Chưa có dữ liệu phân tích</div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div><h3 className="text-lg font-bold text-red-700">Đơn In Nhưng Chưa Đi</h3><p className="text-sm text-red-500">Cần kiểm tra kho hoặc trạng thái hủy</p></div>
                  <div className="text-4xl font-bold text-red-600">{reportData.notShipped.length}</div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.barData} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                       <XAxis type="number" hide /><YAxis dataKey="name" type="category" width={100} style={{fontSize: '10px'}} />
                       <RechartsTooltip /><Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><span className="text-blue-600 text-xs font-bold uppercase">Tổng Đơn Đã In</span><p className="text-2xl font-bold text-blue-800 mt-1">{reportData.filteredIn.length}</p></div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100"><span className="text-green-600 text-xs font-bold uppercase">Đã Khớp Đơn Đi</span><p className="text-2xl font-bold text-green-800 mt-1">{reportData.filteredIn.length - reportData.notShipped.length}</p></div>
            </div>
          </div>
        </div>

        {/* Detail Table Tab 1 */}
        <Card>
          <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 gap-4">
             <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-800">Chi Tiết ({filteredNotShipped.length} / {reportData.notShipped.length})</h3></div>
             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0"><Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" /><input type="text" placeholder="Tìm mã đơn, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-full md:w-48" /></div>
                <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white"><option value="">Tất cả ngày</option>{[...new Set(reportData.notShipped.map(i => i.date))].sort().map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select value={filterCarrier} onChange={(e) => setFilterCarrier(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white"><option value="">Tất cả ĐVVC</option>{[...new Set(reportData.notShipped.map(i => i.carrier))].sort().map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white"><option value="">Tất cả Trạng thái</option>{[...new Set(reportData.notShipped.map(i => i.currentStatus))].sort().map(s => <option key={s} value={s}>{s}</option>)}</select>
                {(searchTerm || filterDate || filterCarrier || filterStatus) && (<button onClick={() => { setSearchTerm(''); setFilterDate(''); setFilterCarrier(''); setFilterStatus(''); }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>)}
                <button onClick={handleExport} disabled={filteredNotShipped.length === 0} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${filteredNotShipped.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}><Download className="w-4 h-4" />Xuất Excel</button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs"><tr><th className="px-6 py-3">Ngày In</th><th className="px-6 py-3">Mã Vận Đơn / ID</th><th className="px-6 py-3">ĐVVC</th><th className="px-6 py-3">Sản phẩm</th><th className="px-4 py-3 text-center">SL</th><th className="px-6 py-3">Trạng Thái</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredNotShipped.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{row.date}</td>
                    <td className="px-6 py-3"><div className="font-mono text-blue-600 font-medium">{row.trackingCode}</div>{row.orderId && row.orderId !== row.trackingCode && (<div className="text-xs text-gray-400">ID: {row.orderId}</div>)}</td>
                    <td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-xs border ${row.carrier === 'SPX' ? 'bg-orange-50 text-orange-600 border-orange-200' : row.carrier === 'J&T' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{row.carrier}</span></td>
                    <td className="px-6 py-3 text-gray-600 max-w-xs truncate" title={row.product}>{row.product || '-'}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{row.totalQty > 0 ? row.totalQty : '-'}</td>
                    <td className="px-6 py-3"><span className={`font-medium ${row.currentStatus.includes('Hủy') ? 'text-red-600' : row.currentStatus.includes('Thành công') ? 'text-green-600' : 'text-gray-600'}`}>{row.currentStatus}</span></td>
                  </tr>
                ))}
                {filteredNotShipped.length === 0 && (<tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</td></tr>)}
              </tbody>
            </table>
          </div>
          {Math.ceil(filteredNotShipped.length / itemsPerPage) > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-500">Trang <span className="font-medium">{currentPage}</span> / {Math.ceil(filteredNotShipped.length / itemsPerPage)}</div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredNotShipped.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredNotShipped.length / itemsPerPage)} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>
          )}
        </Card>
    </div>
  );

  const renderCancellationTab = () => (
    <div className="space-y-6">
        {/* Upload Section */}
        <Card className="border-l-4 border-l-red-500">
            <CardHeader title="Upload File Đơn Hủy Shopee" icon={FileWarning} />
            <CardContent>
              <div className="relative group h-32">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleCancellationUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-red-50 transition-colors">
                  <Upload className="text-gray-400 w-8 h-8 mb-2" />
                  <span className="text-sm text-red-600 font-medium">Chọn file Hủy Shopee</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500 italic">* Hệ thống tự động lọc bỏ lý do: "Chưa thanh toán", "Giao hàng thất bại" và "Khách hàng hủy".</p>
              <div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-red-600">{cancelData.length}</span> dòng hợp lệ</div>
            </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-6 mb-6">
            <Card className="bg-red-50 border border-red-100">
                <CardContent className="flex flex-col md:flex-row justify-between items-center p-6">
                    <h3 className="text-lg font-bold text-red-800 mb-4 md:mb-0">Tổng quan Hủy</h3>
                    <div className="flex gap-8">
                        <div className="flex flex-col items-center">
                            <span className="text-red-600 text-sm font-medium uppercase">Tổng dòng xác nhận</span>
                            <span className="text-2xl font-bold text-red-900">{cancelData.length}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-red-600 text-sm font-medium uppercase">Tổng sản phẩm</span>
                            <span className="text-2xl font-bold text-red-900">{cancelData.reduce((acc, i) => acc + i.qty, 0)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Summary Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table SKU */}
            <Card>
                <CardHeader title="Tổng hợp số lượng hủy theo SKU" icon={Filter} />
                <div className="p-4 h-80 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                            <tr><th className="px-4 py-2">SKU Phân Loại</th><th className="px-4 py-2 text-right">Tổng Số Lượng</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cancelReportData.summaryList.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-800 font-medium">{item.sku}</td>
                                    <td className="px-4 py-2 text-right text-red-600 font-bold">{item.totalQty}</td>
                                </tr>
                            ))}
                            {cancelReportData.summaryList.length === 0 && <tr><td colSpan="2" className="p-4 text-center text-gray-400">Chưa có dữ liệu</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            {/* Table Reason */}
            <Card>
                <CardHeader title="Tổng hợp đơn hủy theo lý do" icon={AlertCircle} />
                <div className="p-4 h-80 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                            <tr><th className="px-4 py-2">Lý do hủy</th><th className="px-4 py-2 text-right">SL Đơn</th><th className="px-4 py-2 text-right">Tổng SP</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cancelReportData.reasonList.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-gray-800 font-medium truncate max-w-[200px]" title={item.reason}>{item.reason}</td>
                                    <td className="px-4 py-2 text-right text-red-600 font-bold">{item.orderCount}</td>
                                    <td className="px-4 py-2 text-right text-gray-500">{item.totalQty}</td>
                                </tr>
                            ))}
                            {cancelReportData.reasonList.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-400">Chưa có dữ liệu</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        {/* Detail Table */}
        <Card>
            <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 gap-4">
             <div className="flex items-center gap-2"><FileWarning className="w-5 h-5 text-red-600" /><h3 className="font-semibold text-gray-800">Chi Tiết Đơn Hủy</h3></div>
             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0"><Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" /><input type="text" placeholder="Tìm SKU..." value={filterCancelSku} onChange={(e) => setFilterCancelSku(e.target.value)} className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 w-full md:w-48" /></div>
                <select value={filterCancelReason} onChange={(e) => setFilterCancelReason(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white"><option value="">Tất cả Lý do</option>{uniqueCancelReasons.map(r => <option key={r} value={r}>{r}</option>)}</select>
                <button onClick={handleExportCancel} disabled={cancelReportData.filteredDetails.length === 0} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${cancelReportData.filteredDetails.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-red-600 hover:bg-red-700 text-white'}`}><Download className="w-4 h-4" />Xuất Excel</button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr><th className="px-6 py-3">Mã đơn hàng</th><th className="px-6 py-3">SKU Phân loại</th><th className="px-6 py-3">Số lượng</th><th className="px-6 py-3">Lý do hủy</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {currentCancelData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-mono text-gray-700">{row.orderId}</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{row.sku}</td>
                            <td className="px-6 py-3 font-bold text-red-600">{row.qty}</td>
                            <td className="px-6 py-3 text-gray-600">{row.reason}</td>
                        </tr>
                    ))}
                    {currentCancelData.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Không có dữ liệu</td></tr>}
                </tbody>
            </table>
          </div>
          {totalCancelPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-500">Trang <span className="font-medium">{cancelPage}</span> / {totalCancelPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setCancelPage(p => Math.max(1, p - 1))} disabled={cancelPage === 1} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button onClick={() => setCancelPage(p => Math.min(totalCancelPages, p + 1))} disabled={cancelPage === totalCancelPages} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>
          )}
        </Card>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-6">
        <Card className="border-l-4 border-l-purple-500">
            <CardHeader title="Upload File Kiểm Kê (Nhanh.vn)" icon={ClipboardList} />
            <CardContent>
              <div className="relative group h-32">
                <input type="file" multiple accept=".csv,.xlsx,.xls" onChange={handleInventoryFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-purple-50 transition-colors">
                  <Upload className="text-gray-400 w-8 h-8 mb-2" />
                  <span className="text-sm text-purple-600 font-medium">Chọn nhiều file kiểm kê</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-purple-600">{inventoryRawData.length}</span> dòng</div>
            </CardContent>
        </Card>

        {/* Inventory Stats Card */}
        {inventoryStats.netQty !== 0 || inventoryStats.excessCount > 0 || inventoryStats.missingCount > 0 ? (
          <Card className={`border ${inventoryStats.netQty >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${inventoryStats.netQty >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {inventoryStats.netQty >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Tổng Chênh Lệch</p>
                  <h3 className={`text-2xl font-bold ${inventoryStats.netQty >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {inventoryStats.netQty > 0 ? `+${inventoryStats.netQty}` : inventoryStats.netQty}
                  </h3>
                </div>
              </div>
              
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div>
                    <span className="font-semibold text-gray-700">{inventoryStats.excessCount}</span> mã thừa 
                    <span className="text-green-600 font-bold ml-1">(+{inventoryStats.excessQty})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div>
                    <span className="font-semibold text-gray-700">{inventoryStats.missingCount}</span> mã thiếu
                    <span className="text-red-600 font-bold ml-1">({inventoryStats.missingQty})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Inventory Report Table */}
        <Card>
            <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 gap-4">
             <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-gray-800">Tổng Hợp Kiểm Kê ({inventoryReportData.length})</h3></div>
             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0"><Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" /><input type="text" placeholder="Tìm Mã SP..." value={filterInventorySku} onChange={(e) => setFilterInventorySku(e.target.value)} className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 w-full md:w-48" /></div>
                
                {/* Status Filter Dropdown */}
                <select 
                  value={filterInventoryStatus} 
                  onChange={(e) => setFilterInventoryStatus(e.target.value)} 
                  className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="excess">Chỉ hiện mã Thừa (+)</option>
                  <option value="missing">Chỉ hiện mã Thiếu (-)</option>
                  <option value="exact">Chỉ hiện mã Đủ (0)</option>
                </select>

                <button onClick={handleExportInventory} disabled={inventoryReportData.length === 0} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${inventoryReportData.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}><Download className="w-4 h-4" />Xuất Excel</button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr><th className="px-6 py-3">Mã Sản Phẩm</th><th className="px-6 py-3 text-center">Tổng Thừa Thiếu</th><th className="px-6 py-3 text-right">Ngày Kiểm Gần Nhất</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {currentInventoryData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium text-gray-900">{item.sku}</td>
                            <td className={`px-6 py-3 text-center font-bold ${item.totalDiff > 0 ? 'text-green-600' : item.totalDiff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {item.totalDiff > 0 ? `Thừa ${item.totalDiff}` : item.totalDiff < 0 ? `Thiếu ${Math.abs(item.totalDiff)}` : 'Đủ'}
                            </td>
                            <td className="px-6 py-3 text-right text-gray-600">{item.lastDate}</td>
                        </tr>
                    ))}
                    {currentInventoryData.length === 0 && <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">Không có dữ liệu trong khoảng thời gian này</td></tr>}
                </tbody>
            </table>
          </div>
          {totalInventoryPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-500">Trang <span className="font-medium">{inventoryPage}</span> / {totalInventoryPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                <button onClick={() => setInventoryPage(p => Math.min(totalInventoryPages, p + 1))} disabled={inventoryPage === totalInventoryPages} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
              </div>
            </div>
          )}
        </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Main Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Truck className="text-blue-600" />AME Logistics Manager</h1>
            <p className="text-gray-500 text-sm">Hệ thống đối soát & Báo cáo</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <span className="text-xs text-gray-500 font-medium px-2">Năm:</span>
            <input type="number" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} className="w-16 text-sm border border-gray-300 rounded px-1" />
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm border-none focus:ring-0 text-gray-700 outline-none" />
            <span className="text-gray-400">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm border-none focus:ring-0 text-gray-700 outline-none" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-fit">
            <button 
                onClick={() => setActiveTab('tracking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'tracking' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Layers className="w-4 h-4" /> Đối Soát Đơn Hàng
            </button>
            <button 
                onClick={() => setActiveTab('cancellation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'cancellation' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <FileWarning className="w-4 h-4" /> Báo Cáo Hủy Shopee
            </button>
            <button 
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <ClipboardList className="w-4 h-4" /> Báo Cáo Kiểm Kê
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'tracking' ? renderTrackingTab() : activeTab === 'cancellation' ? renderCancellationTab() : renderInventoryTab()}

      </div>
    </div>
  );
};

export default MainApp;