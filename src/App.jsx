import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx'; // Import thư viện đọc Excel
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, LabelList,
  PieChart, Pie
} from 'recharts';
import { 
  Upload, FileText, Filter, Download, AlertCircle, 
  Truck, Search, Calendar, ChevronLeft, ChevronRight, XCircle, FileWarning, Layers, ClipboardList, TrendingUp, TrendingDown, RefreshCcw, Save, Database,
  Plus, Trash2, ChevronDown, ChevronUp, Bold, Italic, Underline, Highlighter, Type, List, CheckCircle, X, FileInput, Image as ImageIcon, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';

// --- Cấu hình màu sắc ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#FF6666', '#99CCFF', '#CC99FF'];
const RETURN_COLORS = {
  'Shopee': '#FF6600', // Màu cam Shopee
  'Tiktok': '#000000', // Màu đen Tiktok (hoặc xám đậm)
  'BBBG': '#d93025'    // Màu đỏ BBBG
};

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

// --- Component Notification (Toast) ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, type === 'error' ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [onClose, type]);

  return (
    <div className={`fixed top-4 right-4 z-[10000] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-5 duration-300 ${
      type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 hover:bg-black/5 rounded-full p-1 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Component Confirm Modal ---
const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl scale-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Đồng ý</button>
        </div>
      </div>
    </div>
  );
};

// --- Watermark Component ---
const Watermark = () => {
  const text = "Designed and Developed by Hồ Tá Vinh";
  // Tạo các hàng và cột
  const rows = Array.from({ length: 40 }); 
  const cols = Array.from({ length: 15 });

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex items-center justify-center bg-transparent">
      {/* Container xoay chéo */}
      <div className="w-[200vw] h-[200vh] flex flex-col justify-center items-center transform -rotate-45 opacity-[0.05]">
        {rows.map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex w-full justify-center items-center gap-32 mb-16"
            // Dịch chuyển các dòng chẵn/lẻ để tạo hiệu ứng so le
            style={{ transform: rowIndex % 2 === 0 ? 'translateX(100px)' : 'translateX(-100px)' }}
          >
            {cols.map((_, colIndex) => (
               <div key={colIndex} className="text-sm font-bold text-gray-900 whitespace-nowrap select-none">
                 {text}
               </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Simple Rich Text Editor Component ---
const RichTextEditor = ({ content, onUpdate }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        onUpdate(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        // Chèn ảnh tại vị trí con trỏ hoặc cuối cùng
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertImage', false, imageUrl);
            onUpdate(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <button onMouseDown={(e) => {e.preventDefault(); execCmd('bold');}} className="p-1.5 hover:bg-gray-200 rounded" title="In đậm"><Bold className="w-4 h-4" /></button>
        <button onMouseDown={(e) => {e.preventDefault(); execCmd('italic');}} className="p-1.5 hover:bg-gray-200 rounded" title="In nghiêng"><Italic className="w-4 h-4" /></button>
        <button onMouseDown={(e) => {e.preventDefault(); execCmd('underline');}} className="p-1.5 hover:bg-gray-200 rounded" title="Gạch chân"><Underline className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button onMouseDown={(e) => {e.preventDefault(); execCmd('insertUnorderedList');}} className="p-1.5 hover:bg-gray-200 rounded" title="Danh sách"><List className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <div className="flex items-center gap-1 group relative">
            <Type className="w-4 h-4 text-gray-600" />
            <input type="color" className="w-6 h-6 border-none p-0 cursor-pointer" title="Màu chữ" onChange={(e) => execCmd('foreColor', e.target.value)} />
        </div>
        <div className="flex items-center gap-1 group relative ml-2">
            <Highlighter className="w-4 h-4 text-gray-600" />
            <input type="color" className="w-6 h-6 border-none p-0 cursor-pointer" title="Màu nền (Highlight)" defaultValue="#ffff00" onChange={(e) => execCmd('hiliteColor', e.target.value)} />
        </div>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* Nút chèn ảnh */}
        <button 
            onMouseDown={(e) => { e.preventDefault(); fileInputRef.current.click(); }} 
            className="p-1.5 hover:bg-gray-200 rounded flex items-center gap-1" 
            title="Chèn ảnh"
        >
            <ImageIcon className="w-4 h-4 text-gray-600" />
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
        />
      </div>
      
      {/* Content Area */}
      <div 
        ref={editorRef}
        className="p-4 min-h-[150px] outline-none prose prose-sm max-w-none"
        contentEditable
        suppressContentEditableWarning={true}
        onBlur={(e) => onUpdate(e.target.innerHTML)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

const MainApp = () => {
  // --- Tab State ---
  const [activeTab, setActiveTab] = useState('notes'); 
  const [isClient, setIsClient] = useState(false); 
  
  // --- Notification State ---
  const [notification, setNotification] = useState(null); 
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const closeToast = () => {
    setNotification(null);
  };

  // ================= STATE COMMON =================
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [targetYear, setTargetYear] = useState(2026);

  // ================= STATE TAB NOTES =================
  const [notes, setNotes] = useState([
    { id: 1, title: 'Báo cáo 1', content: '<ul><li>Nội dung...</li><li><b>Lưu ý:</b> Designed and Developed by Hồ Tá Vinh</li></ul>', expanded: true }
  ]);

  // ================= STATE TAB 1: ĐỐI SOÁT =================
  const [inFiles, setInFiles] = useState([]);     
  const [outData, setOutData] = useState([]);     
  const [statusMap, setStatusMap] = useState({ byId: {}, byCode: {} }); 
  
  // Filter state for Tab 1
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

  // ================= STATE TAB 3: KIỂM KÊ =================
  const [inventoryRawData, setInventoryRawData] = useState([]);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [filterInventorySku, setFilterInventorySku] = useState('');
  const [filterInventoryStatus, setFilterInventoryStatus] = useState('');
  // Thêm state sort cho kiểm kê
  const [inventorySort, setInventorySort] = useState({ key: 'sku', direction: 'asc' }); 

  // ================= STATE TAB 4: HÀNG HOÀN =================
  const [bbbgData, setBbbgData] = useState([]); 
  const [shopeeReturnData, setShopeeReturnData] = useState([]);
  const [tiktokReturnData, setTiktokReturnData] = useState([]);
  const [returnFilterType, setReturnFilterType] = useState('All'); 
  const [returnSearchTerm, setReturnSearchTerm] = useState('');
  const [returnPage, setReturnPage] = useState(1);
  const returnItemsPerPage = 50;

  // Auto Reset Pages on Filter Change
  useEffect(() => { setReturnPage(1); }, [returnFilterType, returnSearchTerm]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterDate, filterCarrier, filterStatus]);
  useEffect(() => { setCancelPage(1); }, [filterCancelSku, filterCancelReason]);
  useEffect(() => { setInventoryPage(1); }, [filterInventorySku, filterInventoryStatus]);

  // ================= UTILS =================
  const parseDateFlexible = (rawDate) => {
    if (!rawDate) return 'Chưa rõ';
    if (typeof rawDate === 'number') {
        const dateObj = new Date(Math.round((rawDate - 25569)*86400*1000));
        return dateObj.toISOString().split('T')[0];
    }
    const str = String(rawDate).trim();
    if (str.match(/^\d{4}-\d{2}-\d{2}/)) return str.substring(0, 10);
    const parts = str.split(/[\/\-]/);
    if (parts.length === 3) {
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
    }
    return str; 
  };

  // ================= DATA MANAGEMENT =================
  const handleExportData = () => {
    const dataToSave = {
      timestamp: new Date().toISOString(),
      common: { startDate, endDate, targetYear },
      notes: notes,
      tab1: { inFiles, outData, statusMap },
      tab2: { cancelData },
      tab3: { inventoryRawData },
      tab4: { bbbgData, shopeeReturnData, tiktokReturnData }
    };
    const jsonString = JSON.stringify(dataToSave);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AME_Data_Backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất file dữ liệu thành công!", "success");
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.common) { setStartDate(data.common.startDate); setEndDate(data.common.endDate); setTargetYear(data.common.targetYear); }
        if (data.notes) setNotes(data.notes);
        if (data.tab1) { setInFiles(data.tab1.inFiles || []); setOutData(data.tab1.outData || []); setStatusMap(data.tab1.statusMap || { byId: {}, byCode: {} }); }
        if (data.tab2) setCancelData(data.tab2.cancelData || []);
        if (data.tab3) setInventoryRawData(data.tab3.inventoryRawData || []);
        if (data.tab4) { setBbbgData(data.tab4.bbbgData || []); setShopeeReturnData(data.tab4.shopeeReturnData || []); setTiktokReturnData(data.tab4.tiktokReturnData || []); }
        showToast("Nhập dữ liệu thành công!", "success");
      } catch (error) { console.error(error); showToast("File dữ liệu không hợp lệ!", "error"); }
    };
    reader.readAsText(file);
  };

  // ================= LOGIC TAB NOTES =================
  const addNote = () => {
    setNotes([{ id: Date.now(), title: 'Ý chính mới...', content: '', expanded: true }, ...notes]);
  };
  const deleteNote = (id) => {
    setConfirmModal({ isOpen: true, message: 'Bạn có chắc chắn muốn xóa ghi chú này không?', onConfirm: () => { setNotes(notes.filter(n => n.id !== id)); setConfirmModal({ isOpen: false, message: '', onConfirm: null }); showToast('Đã xóa ghi chú', 'success'); } });
  };
  const toggleNote = (id) => setNotes(notes.map(n => n.id === id ? { ...n, expanded: !n.expanded } : n));
  const updateNoteTitle = (id, newTitle) => setNotes(notes.map(n => n.id === id ? { ...n, title: newTitle } : n));
  const updateNoteContent = (id, newContent) => setNotes(notes.map(n => n.id === id ? { ...n, content: newContent } : n));

  // ================= LOGIC TAB 1 =================
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
                    headerRowIndex = i; break;
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
                  if (carrierName) carriers.push({ index: idx, name: carrierName });
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
                          trackingCode, carrier: carrier.name, originalColumn: headerRow[carrier.index], date: finalDate, sourceFile: `${file.name} - Sheet: ${sheetName}`
                        });
                      }
                    }
                  });
                }
            }
          }
        });
      } catch (error) { console.error("Lỗi đọc file:", file.name, error); showToast(`Lỗi đọc file ${file.name}`, 'error'); }
    }
    setInFiles(prev => [...prev, ...parsedOrders]);
    if (parsedOrders.length > 0) showToast(`Đã tải ${parsedOrders.length} đơn in`, 'success');
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
        if (idx !== -1) { headerIdx = i; codeIdx = idx; break; }
      }
      const outSet = new Set();
      let outCount = 0;
      if (headerIdx !== -1 && codeIdx !== -1) {
          for (let i = headerIdx + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row) continue;
            const code = row[codeIdx]?.toString().trim();
            if (code) { outSet.add(code); outCount++; }
          }
      } else { showToast(`Không tìm thấy cột 'Mã vận đơn' trong file Đơn Đi`, 'error'); return; }
      setOutData(Array.from(outSet));
      const bbbgSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('hàng hoàn') && name.toLowerCase().includes('bbbg'));
      if (bbbgSheetName) {
          const bSheet = workbook.Sheets[bbbgSheetName];
          const bData = XLSX.utils.sheet_to_json(bSheet, { header: 1 });
          let bHeaderIdx = -1;
          let bDateIdx = -1, bCodeIdx = -1, bCarrierIdx = -1, bProdIdx = -1, bQtyIdx = -1;
          for(let i=0; i<Math.min(20, bData.length); i++) {
              const row = bData[i];
              if (!row || !Array.isArray(row)) continue;
              const rStr = JSON.stringify(row).toLowerCase();
              if (rStr.includes('mã đơn') || rStr.includes('mã vận đơn')) {
                  bHeaderIdx = i;
                  bDateIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('ngày'));
                  bCodeIdx = row.findIndex(c => c && (c.toString().toLowerCase().includes('mã đơn') || c.toString().toLowerCase().includes('mã vận đơn')));
                  bCarrierIdx = row.findIndex(c => c && (c.toString().toLowerCase().includes('đvvc') || c.toString().toLowerCase().includes('hãng')));
                  bProdIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('sản phẩm'));
                  bQtyIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('số lượng'));
                  break;
              }
          }
          if (bHeaderIdx !== -1) {
              const extractedBBBG = [];
              for(let i = bHeaderIdx + 1; i < bData.length; i++) {
                  const row = bData[i];
                  if (!row) continue;
                  const dDate = bDateIdx !== -1 ? parseDateFlexible(row[bDateIdx]) : 'Chưa rõ';
                  const dCode = (bCodeIdx !== -1 && row[bCodeIdx]) ? row[bCodeIdx].toString().trim() : '';
                  const dCarrier = bCarrierIdx !== -1 ? row[bCarrierIdx] : '';
                  const dProd = bProdIdx !== -1 ? row[bProdIdx] : '';
                  const dQty = bQtyIdx !== -1 ? (parseInt(row[bQtyIdx]) || 0) : 0;
                  if (dCode || dProd) { extractedBBBG.push({ source: 'BBBG', date: dDate, code: dCode, carrier: dCarrier, product: dProd, qty: dQty }); }
              }
              setBbbgData(extractedBBBG);
          }
      }
      showToast(`Đã tải ${outCount} đơn đi`, 'success');
    } catch (error) { console.error(error); showToast("Lỗi đọc file Đơn Đi", 'error'); }
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
          headerIdx = i; codeIdx = cIdx; idIdx = iIdx;
          statusIdx = row.findIndex(c => c && c.toString().includes('Trạng thái'));
          customerIdx = row.findIndex(c => c && c.toString().includes('Tên khách hàng'));
          productIdx = row.findIndex(c => c && c.toString().includes('Sản phẩm'));
          qtyIdx = row.findIndex(c => c && c.toString().includes('Số lượng'));
          break;
        }
      }
      if (idIdx === -1 && codeIdx === -1) { showToast("Không tìm thấy cột Mã vận đơn hoặc ID", 'error'); return; }
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
                id: rowId, code: rowCode, status: (statusIdx !== -1 && row[statusIdx]) ? row[statusIdx] : 'Không xác định',
                customer: (customerIdx !== -1 && row[customerIdx]) ? row[customerIdx] : '', items: [{ name: rowProduct, qty: rowQty }]
            };
        } else if (currentOrder) { if (rowProduct) currentOrder.items.push({ name: rowProduct, qty: rowQty }); }
      }
      commitOrder(currentOrder);
      setStatusMap({ byId, byCode });
      showToast("Đã tải dữ liệu trạng thái", 'success');
    } catch (error) { console.error(error); showToast("Lỗi đọc file Trạng Thái", 'error'); }
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
      return { ...item, currentStatus: info.status || 'Chưa cập nhật', customer: info.customer || '', product: info.product || '', totalQty: info.totalQty || 0, orderId: info.id || '' };
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
      const codeStr = item.trackingCode ? item.trackingCode.toString().toLowerCase() : '';
      const idStr = item.orderId ? item.orderId.toString().toLowerCase() : '';
      const prodStr = item.product ? item.product.toString().toLowerCase() : '';
      const matchSearch = !searchTerm || codeStr.includes(searchLower) || idStr.includes(searchLower) || prodStr.includes(searchLower);
      const matchDate = !filterDate || item.date === filterDate;
      const matchCarrier = !filterCarrier || item.carrier === filterCarrier;
      const matchStatus = !filterStatus || item.currentStatus === filterStatus;
      return matchSearch && matchDate && matchCarrier && matchStatus;
    });
  }, [reportData.notShipped, searchTerm, filterDate, filterCarrier, filterStatus]);

  const handleExport = () => {
    if (filteredNotShipped.length === 0) { showToast("Không có dữ liệu!", 'error'); return; }
    const ws = XLSX.utils.json_to_sheet(filteredNotShipped.map(item => ({
      'Ngày in': item.date, 'Mã vận đơn': item.trackingCode, 'ID tìm thấy': item.orderId, 'Sản phẩm': item.product, 'SL': item.totalQty, 'Trạng thái': item.currentStatus, 'ĐVVC': item.carrier
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Don_Chua_Di");
    XLSX.writeFile(wb, `Don_Chua_Di_${startDate}_${endDate}.xlsx`);
    showToast("Đã xuất file Excel", 'success');
  };

  // ================= LOGIC TAB 2 & 3 =================
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
      if (headerIdx === -1) { showToast("Không tìm thấy header file Hủy", 'error'); return; }
      const extracted = [];
      let currentOrderId = null;
      let currentReason = null;
      const excludeReasons = [ "chưa được thanh toán", "giao hàng thất bại", "người mua", "khách hàng" ];
      for(let i = headerIdx + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        let oId = row[orderIdIdx];
        let reason = row[reasonIdx];
        if (oId) { currentOrderId = oId; currentReason = reason; }
        const effectiveOrderId = oId || currentOrderId;
        const effectiveReason = reason || currentReason;
        if (!effectiveOrderId) continue;
        const reasonLower = effectiveReason ? effectiveReason.toString().toLowerCase() : "";
        const isExcluded = excludeReasons.some(excluded => reasonLower.includes(excluded));
        if (isExcluded) continue;
        const sku = row[skuIdx] ? row[skuIdx].toString() : "Không rõ";
        const qty = row[qtyIdx] ? parseInt(row[qtyIdx]) || 0 : 0;
        extracted.push({ orderId: effectiveOrderId, reason: effectiveReason, sku: sku, qty: qty });
      }
      setCancelData(extracted);
      showToast(`Đã tải ${extracted.length} đơn hủy hợp lệ`, 'success');
    } catch (error) { console.error(error); showToast("Lỗi đọc file Hủy", 'error'); }
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
      if (!skuStats[s]) { skuStats[s] = 0; }
      skuStats[s] += item.qty;
    });
    const summaryList = Object.entries(skuStats).map(([sku, totalQty]) => ({ sku, totalQty })).sort((a, b) => b.totalQty - a.totalQty);
    const reasonStats = {};
    cancelData.forEach(item => {
      const r = item.reason || "Không rõ";
      if (!reasonStats[r]) { reasonStats[r] = { reason: r, orderIds: new Set(), totalQty: 0 }; }
      reasonStats[r].orderIds.add(item.orderId);
      reasonStats[r].totalQty += item.qty;
    });
    const reasonList = Object.values(reasonStats).map(stat => ({ reason: stat.reason, orderCount: stat.orderIds.size, totalQty: stat.totalQty })).sort((a, b) => b.orderCount - a.orderCount);
    return { filteredDetails, summaryList, reasonList };
  }, [cancelData, filterCancelSku, filterCancelReason]);

  const handleExportCancel = () => {
    if (cancelReportData.filteredDetails.length === 0) { showToast("Không có dữ liệu hủy để xuất", 'error'); return; }
    const exportRows = [];
    let previousOrderId = null;
    cancelReportData.filteredDetails.forEach(item => {
        const displayOrderId = item.orderId === previousOrderId ? "" : item.orderId;
        exportRows.push({ 'Mã đơn hàng': displayOrderId, 'Lý do hủy': item.reason, 'SKU phân loại': item.sku, 'Số lượng': item.qty });
        previousOrderId = item.orderId;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Huy");
    XLSX.writeFile(wb, "Bao_Cao_Don_Huy_Shopee.xlsx");
    showToast("Đã xuất file Excel", 'success');
  };

  const totalCancelPages = Math.ceil(cancelReportData.filteredDetails.length / itemsPerPage);
  const currentCancelData = cancelReportData.filteredDetails.slice( (cancelPage - 1) * itemsPerPage, cancelPage * itemsPerPage );
  const uniqueCancelReasons = [...new Set(cancelData.map(i => i.reason))].sort();

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
        if (headerIdx === -1 || skuIdx === -1 || diffIdx === -1) { showToast(`File ${file.name} không đúng định dạng kiểm kê`, 'error'); continue; }
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
                if (parts.length === 3) { formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; } else { formattedDate = rawDate.toString(); }
             }
          }
          const sku = row[skuIdx] ? row[skuIdx].toString().trim() : '';
          const diff = row[diffIdx] ? parseInt(row[diffIdx]) || 0 : 0;
          if (sku) { newRecords.push({ date: formattedDate, sku: sku, diff: diff, sourceFile: file.name }); }
        }
      } catch (error) { console.error("Lỗi đọc file kiểm kê:", file.name, error); showToast(`Lỗi đọc file ${file.name}`, 'error'); }
    }
    setInventoryRawData(prev => [...prev, ...newRecords]);
    if (newRecords.length > 0) showToast(`Đã thêm ${newRecords.length} dòng kiểm kê`, 'success');
  };

  const handleInventorySort = (key) => {
    setInventorySort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const inventoryStats = useMemo(() => {
    const filteredRecords = inventoryRawData.filter(item => {
      if (!item.date) return false;
      return item.date >= startDate && item.date <= endDate;
    });
    const skuMap = {};
    filteredRecords.forEach(item => {
      if (!skuMap[item.sku]) { skuMap[item.sku] = 0; }
      skuMap[item.sku] += item.diff;
    });
    let excessCount = 0; let missingCount = 0; let excessQty = 0; let missingQty = 0;
    Object.values(skuMap).forEach(diff => {
      if (diff > 0) { excessCount++; excessQty += diff; } else if (diff < 0) { missingCount++; missingQty += diff; }
    });
    return { excessCount, missingCount, excessQty, missingQty, netQty: excessQty + missingQty };
  }, [inventoryRawData, startDate, endDate]);

  const inventoryReportData = useMemo(() => {
    const filteredRecords = inventoryRawData.filter(item => {
      if (!item.date) return false;
      return item.date >= startDate && item.date <= endDate;
    });
    const skuMap = {};
    filteredRecords.forEach(item => {
      if (!skuMap[item.sku]) { skuMap[item.sku] = { sku: item.sku, totalDiff: 0, lastDate: item.date }; }
      skuMap[item.sku].totalDiff += item.diff;
      if (item.date > skuMap[item.sku].lastDate) { skuMap[item.sku].lastDate = item.date; }
    });
    let reportList = Object.values(skuMap);
    if (filterInventorySku) {
      const lowerSearch = filterInventorySku.toLowerCase();
      reportList = reportList.filter(item => item.sku && item.sku.toString().toLowerCase().includes(lowerSearch));
    }
    if (filterInventoryStatus) {
      if (filterInventoryStatus === 'excess') { reportList = reportList.filter(item => item.totalDiff > 0); } 
      else if (filterInventoryStatus === 'missing') { reportList = reportList.filter(item => item.totalDiff < 0); } 
      else if (filterInventoryStatus === 'exact') { reportList = reportList.filter(item => item.totalDiff === 0); }
    }
    
    // Sort logic
    return reportList.sort((a, b) => {
        let comparison = 0;
        if (inventorySort.key === 'sku') {
            const getNum = (s) => {
                const match = s.match(/-[A-Za-z]*(\d+)P/);
                return match ? parseInt(match[1], 10) : 0;
            };
            const numA = getNum(a.sku);
            const numB = getNum(b.sku);
            if (numA !== numB) {
                comparison = numA - numB;
            } else {
                comparison = a.sku.localeCompare(b.sku);
            }
        } else if (inventorySort.key === 'diff') {
            comparison = a.totalDiff - b.totalDiff;
        } else if (inventorySort.key === 'date') {
            comparison = a.lastDate.localeCompare(b.lastDate);
        }
        
        return inventorySort.direction === 'asc' ? comparison : -comparison;
    });
  }, [inventoryRawData, startDate, endDate, filterInventorySku, filterInventoryStatus, inventorySort]);

  const handleExportInventory = () => {
    if (inventoryReportData.length === 0) { showToast("Không có dữ liệu kiểm kê để xuất", 'error'); return; }
    const exportData = inventoryReportData.map(item => ({ 'Mã sản phẩm': item.sku, 'Tổng thừa thiếu': item.totalDiff, 'Ngày kiểm gần nhất': item.lastDate }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Kiem_Ke");
    XLSX.writeFile(wb, `Bao_Cao_Kiem_Ke_${startDate}_${endDate}.xlsx`);
    showToast("Đã xuất file Excel", 'success');
  };

  const totalInventoryPages = Math.ceil(inventoryReportData.length / itemsPerPage);
  const currentInventoryData = inventoryReportData.slice( (inventoryPage - 1) * itemsPerPage, inventoryPage * itemsPerPage );

  // ================= LOGIC TAB 4 =================
  const processReturnFile = async (files, sourceType) => {
    const results = [];
    for (const file of files) {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let headerIdx = -1;
        let codeIdx = -1, prodIdx = -1, qtyIdx = -1;
        for(let i=0; i<Math.min(20, jsonData.length); i++) {
            const row = jsonData[i];
            if(!row || !Array.isArray(row)) continue;
            const rStr = JSON.stringify(row).toLowerCase();
            if (rStr.includes('mã đơn hàng') && rStr.includes('sản phẩm')) {
                headerIdx = i;
                codeIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('mã đơn hàng'));
                prodIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('sản phẩm'));
                qtyIdx = row.findIndex(c => c && c.toString().toLowerCase().includes('số lượng'));
                break;
            }
        }
        if (headerIdx !== -1) {
            let currentOrderId = null;
            for(let i = headerIdx + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row) continue;
                let oId = row[codeIdx];
                if (oId) { currentOrderId = oId; }
                const effectiveOrderId = oId || currentOrderId;
                const prod = row[prodIdx] ? row[prodIdx].toString().trim() : '';
                const qty = qtyIdx !== -1 ? (parseInt(row[qtyIdx]) || 0) : 0;
                if (effectiveOrderId && prod) {
                    results.push({ source: sourceType, code: effectiveOrderId ? effectiveOrderId.toString() : '', product: prod, qty: qty, carrier: sourceType, date: 'Theo File' });
                }
            }
        }
      } catch (e) { console.error(e); }
    }
    return results;
  };

  const handleShopeeReturnUpload = async (e) => {
      const data = await processReturnFile(Array.from(e.target.files), 'Shopee');
      setShopeeReturnData(prev => [...prev, ...data]);
      if(data.length > 0) showToast(`Đã tải ${data.length} đơn hoàn Shopee`, 'success');
  };

  const handleTiktokReturnUpload = async (e) => {
      const data = await processReturnFile(Array.from(e.target.files), 'Tiktok');
      setTiktokReturnData(prev => [...prev, ...data]);
      if(data.length > 0) showToast(`Đã tải ${data.length} đơn hoàn Tiktok`, 'success');
  };

  const returnReportData = useMemo(() => {
      const filteredBbbg = bbbgData.filter(item => {
          if (!item.date || item.date === 'Chưa rõ') return true; 
          return item.date >= startDate && item.date <= endDate;
      });
      const allReturns = [...filteredBbbg, ...shopeeReturnData, ...tiktokReturnData];
      const stats = { 'Shopee': new Set(), 'Tiktok': new Set(), 'BBBG': new Set() };
      allReturns.forEach(item => { if (stats[item.source]) { stats[item.source].add(item.code); } });
      const totalUnique = stats['Shopee'].size + stats['Tiktok'].size + stats['BBBG'].size;
      const chartData = [
          { name: 'Shopee', value: stats['Shopee'].size, fill: RETURN_COLORS['Shopee'] },
          { name: 'Tiktok', value: stats['Tiktok'].size, fill: RETURN_COLORS['Tiktok'] },
          { name: 'BBBG', value: stats['BBBG'].size, fill: RETURN_COLORS['BBBG'] }
      ].filter(d => d.value > 0);
      let tableData = allReturns;
      if (returnFilterType !== 'All') { tableData = tableData.filter(item => item.source === returnFilterType); }
      if (returnSearchTerm) {
          const lowerTerm = returnSearchTerm.toLowerCase();
          tableData = tableData.filter(item => {
              const codeStr = item.code ? item.code.toString().toLowerCase() : '';
              const prodStr = item.product ? item.product.toString().toLowerCase() : '';
              return codeStr.includes(lowerTerm) || prodStr.includes(lowerTerm);
          });
      }
      return { chartData, tableData, totalUnique };
  }, [bbbgData, shopeeReturnData, tiktokReturnData, startDate, endDate, returnFilterType, returnSearchTerm]);

  const handleExportReturn = () => {
    if (returnReportData.tableData.length === 0) { showToast("Không có dữ liệu hoàn để xuất", 'error'); return; }
    const exportRows = returnReportData.tableData.map(item => ({ 'Nguồn': item.source, 'Mã Đơn / Vận Đơn': item.code, 'Sản phẩm': item.product, 'Số lượng': item.qty, 'Ngày (BBBG)': item.date }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Hang_Hoan");
    XLSX.writeFile(wb, `Bao_Cao_Hoan_${returnFilterType}_${startDate}_${endDate}.xlsx`);
    showToast("Đã xuất file Excel", 'success');
  };

  const totalReturnPages = Math.ceil(returnReportData.tableData.length / returnItemsPerPage);
  const currentReturnTableData = returnReportData.tableData.slice( (returnPage - 1) * returnItemsPerPage, returnPage * returnItemsPerPage );

  if (!isClient) return null;

  // ================= RENDER METHODS =================
  const renderNotesTab = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-600"/>Báo cáo kho vận</h2><button onClick={addNote} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm"><Plus className="w-4 h-4" /> Thêm mục</button></div>
      <div className="space-y-4">
        {notes.length === 0 && (<div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">Chưa có ghi chú nào. Bấm "Thêm mục" để bắt đầu.</div>)}
        {notes.map(note => (
          <div key={note.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100"><div className="flex items-center gap-3 flex-grow"><button onClick={() => toggleNote(note.id)} className="text-gray-500 hover:text-blue-600 focus:outline-none">{note.expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button><input type="text" value={note.title} onChange={(e) => updateNoteTitle(note.id, e.target.value)} className="bg-transparent border-none focus:ring-0 text-lg font-semibold text-gray-800 w-full placeholder-gray-400" placeholder="Nhập tiêu đề ý chính..." /></div><button onClick={() => deleteNote(note.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button></div>
            {note.expanded && (<div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200"><RichTextEditor content={note.content} onUpdate={(newContent) => updateNoteContent(note.id, newContent)} /></div>)}
          </div>
        ))}
      </div>
    </div>
  );

  const renderImportTab = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-blue-600"/> 1. Dữ Liệu Đối Soát & Hàng Hoàn BBBG</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500"><CardHeader title="1. Đơn In (Excel)" icon={FileText} /><CardContent><div className="relative group h-32"><input type="file" multiple accept=".xlsx,.xls" onChange={handleInFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"><Upload className="text-gray-400 w-8 h-8 mb-2" /><span className="text-sm text-blue-600 font-medium">Chọn file Excel</span></div></div><div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-blue-600">{inFiles.length}</span> đơn</div></CardContent></Card>
            <Card className="border-l-4 border-l-green-500"><CardHeader title="2. Đơn Đã Đi (Data)" icon={Truck} /><CardContent><div className="relative group h-32"><input type="file" accept=".csv,.xlsx,.xls" onChange={handleOutFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-green-50 transition-colors"><Upload className="text-gray-400 w-8 h-8 mb-2" /><span className="text-sm text-green-600 font-medium">Chọn file Đơn Đi</span></div></div><div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-green-600">{outData.length}</span> đơn</div></CardContent></Card>
            <Card className="border-l-4 border-l-purple-500"><CardHeader title="3. Trạng Thái (Nhanh.vn)" icon={Search} /><CardContent><div className="relative group h-32"><input type="file" accept=".csv,.xlsx,.xls" onChange={handleStatusFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-purple-50 transition-colors"><Upload className="text-gray-400 w-8 h-8 mb-2" /><span className="text-sm text-purple-600 font-medium">Chọn file Trạng Thái</span></div></div><div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-purple-600">{Object.keys(statusMap.byId).length + Object.keys(statusMap.byCode).length}</span> mã</div></CardContent></Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><FileWarning className="w-5 h-5 text-red-600"/> 2. Dữ Liệu Hủy Shopee</h3>
            <Card className="border-l-4 border-l-red-500"><CardHeader title="Upload File Hủy" icon={FileWarning} /><CardContent><div className="relative group h-32"><input type="file" accept=".csv,.xlsx,.xls" onChange={handleCancellationUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-red-50 transition-colors"><Upload className="text-gray-400 w-8 h-8 mb-2" /><span className="text-sm text-red-600 font-medium">Chọn file Hủy Shopee</span></div></div><div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-red-600">{cancelData.length}</span> dòng</div></CardContent></Card>
        </div>

        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-600"/> 3. Dữ Liệu Kiểm Kê</h3>
            <Card className="border-l-4 border-l-purple-500"><CardHeader title="Upload File Kiểm Kê" icon={ClipboardList} /><CardContent><div className="relative group h-32"><input type="file" multiple accept=".csv,.xlsx,.xls" onChange={handleInventoryFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="border-2 border-dashed border-gray-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-purple-50 transition-colors"><Upload className="text-gray-400 w-8 h-8 mb-2" /><span className="text-sm text-purple-600 font-medium">Chọn file Kiểm Kê</span></div></div><div className="mt-2 text-xs text-gray-600 font-medium">Đã tải: <span className="text-purple-600">{inventoryRawData.length}</span> dòng</div></CardContent></Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><RefreshCcw className="w-5 h-5 text-orange-600"/> 4. Dữ Liệu Hàng Hoàn (Sàn)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-orange-500"><CardHeader title="File Hoàn Shopee" icon={Upload} /><CardContent><div className="relative group h-24 mb-2"><input type="file" multiple accept=".xlsx,.xls" onChange={handleShopeeReturnUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="border-2 border-dashed border-orange-300 rounded-lg h-full flex flex-col items-center justify-center hover:bg-orange-50 transition-colors"><Upload className="text-orange-400 w-6 h-6 mb-1" /><span className="text-xs text-orange-600 font-bold">Upload Excel Shopee</span></div></div><div className="text-xs text-gray-600 font-medium">Đã tải: <span className="text-orange-600">{shopeeReturnData.length}</span> dòng</div></CardContent></Card>
            <Card className="border-l-4 border-l-gray-800"><CardHeader title="File Hoàn Tiktok" icon={Upload} /><CardContent><div className="relative group h-24 mb-2"><input type="file" multiple accept=".xlsx,.xls" onChange={handleTiktokReturnUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /><div className="border-2 border-dashed border-gray-400 rounded-lg h-full flex flex-col items-center justify-center hover:bg-gray-100 transition-colors"><Upload className="text-gray-600 w-6 h-6 mb-1" /><span className="text-xs text-gray-800 font-bold">Upload Excel Tiktok</span></div></div><div className="text-xs text-gray-600 font-medium">Đã tải: <span className="text-gray-800">{tiktokReturnData.length}</span> dòng</div></CardContent></Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans relative">
      {notification && <Toast message={notification.message} type={notification.type} onClose={closeToast} />}
      <ConfirmModal isOpen={confirmModal.isOpen} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })} />
      {activeTab !== 'notes' && <Watermark />}

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div><h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Truck className="text-blue-600" />AMELIE - BÁO CÁO KHO VẬN</h1><p className="text-gray-500 text-sm">Designed and Developed by Hồ Tá Vinh</p></div>
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm border-none focus:ring-0 text-gray-700 outline-none" /><span className="text-gray-400">-</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm border-none focus:ring-0 text-gray-700 outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportData} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-xs font-medium transition-colors"><Save className="w-4 h-4" /> Lưu Data</button>
            <div className="relative"><input type="file" accept=".json" onChange={handleImportData} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><button className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-xs font-medium transition-colors"><Database className="w-4 h-4" /> Nhập Data</button></div>
          </div>
        </div>

        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-fit overflow-x-auto">
            <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'notes' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}><ClipboardList className="w-4 h-4" /> Báo cáo tổng quan</button>
            <button onClick={() => setActiveTab('tracking')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'tracking' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Layers className="w-4 h-4" /> Báo cáo đơn đi</button>
            <button onClick={() => setActiveTab('cancellation')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'cancellation' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}><FileWarning className="w-4 h-4" /> Báo cáo đơn hủy Shopee</button>
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'inventory' ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}><ClipboardList className="w-4 h-4" /> Báo cáo kiểm kê</button>
            <button onClick={() => setActiveTab('returns')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'returns' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><RefreshCcw className="w-4 h-4" /> Báo cáo hàng hoàn</button>
            <button onClick={() => setActiveTab('import')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'import' ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Upload className="w-4 h-4" /> Nhập dữ liệu</button>
        </div>

        {activeTab === 'notes' && renderNotesTab()}
        {activeTab === 'import' && renderImportTab()}
        
        {activeTab === 'tracking' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card><CardHeader title="Số lượng đơn theo ĐVVC (Đơn in)" icon={Filter} /><CardContent className="h-80">{reportData.chartData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={reportData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onMouseMove={(state) => state && setHoveredBarIndex(state.isTooltipActive ? state.activeTooltipIndex : null)} onMouseLeave={() => setHoveredBarIndex(null)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><RechartsTooltip /><Legend /><Bar dataKey="value" name="Số lượng đơn" fill="#8884d8">{reportData.chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}<LabelList content={(props) => props.index === hoveredBarIndex ? null : <text x={props.x + props.width / 2} y={props.y} dy={-6} fill="#666" fontSize={12} textAnchor="middle">{props.value}</text>} /></Bar></BarChart></ResponsiveContainer>) : (<div className="h-full flex flex-col items-center justify-center text-gray-400"><AlertCircle className="mb-2" />Chưa có dữ liệu phân tích</div>)}</CardContent></Card>
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-red-50 to-white border-red-200"><CardContent><div className="flex justify-between items-center mb-4"><div><h3 className="text-lg font-bold text-red-700">Đơn in nhưng chưa đi</h3><p className="text-sm text-red-500">Cần kiểm tra kho hoặc trạng thái hủy</p></div><div className="text-4xl font-bold text-red-600">{reportData.notShipped.length}</div></div><div className="h-40"><ResponsiveContainer width="100%" height="100%"><BarChart data={reportData.barData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={100} style={{fontSize: '10px'}} /><RechartsTooltip /><Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
                    <div className="grid grid-cols-2 gap-4"><div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><span className="text-blue-600 text-xs font-bold uppercase">Tổng đơn đã in</span><p className="text-2xl font-bold text-blue-800 mt-1">{reportData.filteredIn.length}</p></div><div className="bg-green-50 p-4 rounded-lg border border-green-100"><span className="text-green-600 text-xs font-bold uppercase">Đơn in đã đi</span><p className="text-2xl font-bold text-green-800 mt-1">{reportData.filteredIn.length - reportData.notShipped.length}</p></div></div>
                  </div>
                </div>
                <Card>
                  <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 gap-4"><div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-800">Chi Tiết ({filteredNotShipped.length} / {reportData.notShipped.length})</h3></div><div className="flex flex-wrap items-center gap-2 w-full md:w-auto"><div className="relative flex-grow md:flex-grow-0"><Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" /><input type="text" placeholder="Tìm mã đơn, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-full md:w-48" /></div><select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white"><option value="">Tất cả ngày</option>{[...new Set(reportData.notShipped.map(i => i.date))].sort().map(d => <option key={d} value={d}>{d}</option>)}</select><select value={filterCarrier} onChange={(e) => setFilterCarrier(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white"><option value="">Tất cả ĐVVC</option>{[...new Set(reportData.notShipped.map(i => i.carrier))].sort().map(c => <option key={c} value={c}>{c}</option>)}</select><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white"><option value="">Tất cả Trạng thái</option>{[...new Set(reportData.notShipped.map(i => i.currentStatus))].sort().map(s => <option key={s} value={s}>{s}</option>)}</select>{(searchTerm || filterDate || filterCarrier || filterStatus) && (<button onClick={() => { setSearchTerm(''); setFilterDate(''); setFilterCarrier(''); setFilterStatus(''); }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-5 h-5" /></button>)}<button onClick={handleExport} disabled={filteredNotShipped.length === 0} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${filteredNotShipped.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}><Download className="w-4 h-4" />Xuất Excel</button></div></div>
                  <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-600 uppercase text-xs"><tr><th className="px-6 py-3">Ngày In</th><th className="px-6 py-3">Mã Vận Đơn / ID</th><th className="px-6 py-3">ĐVVC</th><th className="px-6 py-3">Sản phẩm</th><th className="px-4 py-3 text-center">SL</th><th className="px-6 py-3">Trạng Thái</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredNotShipped.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-6 py-3 font-medium text-gray-900">{row.date}</td><td className="px-6 py-3"><div className="font-mono text-blue-600 font-medium">{row.trackingCode}</div>{row.orderId && row.orderId !== row.trackingCode && (<div className="text-xs text-gray-400">ID: {row.orderId}</div>)}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded-full text-xs border ${row.carrier === 'SPX' ? 'bg-orange-50 text-orange-600 border-orange-200' : row.carrier === 'J&T' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{row.carrier}</span></td><td className="px-6 py-3 text-gray-600 max-w-xs truncate" title={row.product}>{row.product || '-'}</td><td className="px-4 py-3 text-center font-bold text-gray-700">{row.totalQty > 0 ? row.totalQty : '-'}</td><td className="px-6 py-3"><span className={`font-medium ${row.currentStatus.includes('Hủy') ? 'text-red-600' : row.currentStatus.includes('Thành công') ? 'text-green-600' : 'text-gray-600'}`}>{row.currentStatus}</span></td></tr>))}{filteredNotShipped.length === 0 && (<tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</td></tr>)}</tbody></table></div>
                  {Math.ceil(filteredNotShipped.length / itemsPerPage) > 1 && (<div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50"><div className="text-sm text-gray-500">Trang <span className="font-medium">{currentPage}</span> / {Math.ceil(filteredNotShipped.length / itemsPerPage)}</div><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5 text-gray-600" /></button><button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredNotShipped.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredNotShipped.length / itemsPerPage)} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronRight className="w-5 h-5 text-gray-600" /></button></div></div>)}
                </Card>
            </div>
        )}
        
        {activeTab === 'cancellation' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 gap-6 mb-6"><Card className="bg-red-50 border border-red-100"><CardContent className="flex flex-col md:flex-row justify-between items-center p-6"><h3 className="text-lg font-bold text-red-800 mb-4 md:mb-0">Tổng quan đơn hủy</h3><div className="flex gap-8"><div className="flex flex-col items-center"><span className="text-red-600 text-sm font-medium uppercase">Tổng đơn đã hủy bởi Người Bán</span><span className="text-2xl font-bold text-red-900">{cancelData.length}</span></div><div className="flex flex-col items-center"><span className="text-red-600 text-sm font-medium uppercase">Tổng sản phẩm</span><span className="text-2xl font-bold text-red-900">{cancelData.reduce((acc, i) => acc + i.qty, 0)}</span></div></div></CardContent></Card></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card><CardHeader title="Tổng hợp số lượng hủy theo SKU" icon={Filter} /><div className="p-4 h-80 overflow-y-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-600 sticky top-0"><tr><th className="px-4 py-2">SKU Phân Loại</th><th className="px-4 py-2 text-right">Tổng Số Lượng</th></tr></thead><tbody className="divide-y divide-gray-100">{cancelReportData.summaryList.map((item, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-2 text-gray-800 font-medium">{item.sku}</td><td className="px-4 py-2 text-right text-red-600 font-bold">{item.totalQty}</td></tr>))}{cancelReportData.summaryList.length === 0 && <tr><td colSpan="2" className="p-4 text-center text-gray-400">Chưa có dữ liệu</td></tr>}</tbody></table></div></Card>
                    <Card><CardHeader title="Tổng hợp đơn hủy theo lý do" icon={AlertCircle} /><div className="p-4 h-80 overflow-y-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-600 sticky top-0"><tr><th className="px-4 py-2">Lý do hủy</th><th className="px-4 py-2 text-right">SL Đơn</th><th className="px-4 py-2 text-right">Tổng SP</th></tr></thead><tbody className="divide-y divide-gray-100">{cancelReportData.reasonList.map((item, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-2 text-gray-800 font-medium truncate max-w-[200px]" title={item.reason}>{item.reason}</td><td className="px-4 py-2 text-right text-red-600 font-bold">{item.orderCount}</td><td className="px-4 py-2 text-right text-gray-500">{item.totalQty}</td></tr>))}{cancelReportData.reasonList.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-400">Chưa có dữ liệu</td></tr>}</tbody></table></div></Card>
                </div>
                <Card>
                  <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 gap-4"><div className="flex items-center gap-2"><FileWarning className="w-5 h-5 text-red-600" /><h3 className="font-semibold text-gray-800">Chi Tiết Đơn Hủy</h3></div><div className="flex flex-wrap items-center gap-2 w-full md:w-auto"><div className="relative flex-grow md:flex-grow-0"><Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" /><input type="text" placeholder="Tìm SKU..." value={filterCancelSku} onChange={(e) => setFilterCancelSku(e.target.value)} className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 w-full md:w-48" /></div><select value={filterCancelReason} onChange={(e) => setFilterCancelReason(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white"><option value="">Tất cả Lý do</option>{uniqueCancelReasons.map(r => <option key={r} value={r}>{r}</option>)}</select><button onClick={handleExportCancel} disabled={cancelReportData.filteredDetails.length === 0} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${cancelReportData.filteredDetails.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-red-600 hover:bg-red-700 text-white'}`}><Download className="w-4 h-4" />Xuất Excel</button></div></div>
                  <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-600 uppercase text-xs"><tr><th className="px-6 py-3">Mã đơn hàng</th><th className="px-6 py-3">SKU Phân loại</th><th className="px-6 py-3">Số lượng</th><th className="px-6 py-3">Lý do hủy</th></tr></thead><tbody className="divide-y divide-gray-100">{currentCancelData.map((row, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-6 py-3 font-mono text-gray-700">{row.orderId}</td><td className="px-6 py-3 font-medium text-gray-900">{row.sku}</td><td className="px-6 py-3 font-bold text-red-600">{row.qty}</td><td className="px-6 py-3 text-gray-600">{row.reason}</td></tr>))}{currentCancelData.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Không có dữ liệu</td></tr>}</tbody></table></div>
                  {totalCancelPages > 1 && (<div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50"><div className="text-sm text-gray-500">Trang <span className="font-medium">{cancelPage}</span> / {totalCancelPages}</div><div className="flex gap-2"><button onClick={() => setCancelPage(p => Math.max(1, p - 1))} disabled={cancelPage === 1} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5 text-gray-600" /></button><button onClick={() => setCancelPage(p => Math.min(totalCancelPages, p + 1))} disabled={cancelPage === totalCancelPages} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronRight className="w-5 h-5 text-gray-600" /></button></div></div>)}
                </Card>
            </div>
        )}

        {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                {inventoryStats.netQty !== 0 || inventoryStats.excessCount > 0 || inventoryStats.missingCount > 0 ? (<Card className={`border ${inventoryStats.netQty >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4"><div className="flex items-center gap-3"><div className={`p-3 rounded-full ${inventoryStats.netQty >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{inventoryStats.netQty >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}</div><div><p className="text-sm font-medium text-gray-500 uppercase">Tổng Chênh Lệch</p><h3 className={`text-2xl font-bold ${inventoryStats.netQty >= 0 ? 'text-green-700' : 'text-red-700'}`}>{inventoryStats.netQty > 0 ? `+${inventoryStats.netQty}` : inventoryStats.netQty}</h3></div></div><div className="flex gap-6 text-sm"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div><div><span className="font-semibold text-gray-700">{inventoryStats.excessCount}</span> mã thừa <span className="text-green-600 font-bold ml-1">(+{inventoryStats.excessQty})</span></div></div><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><div><span className="font-semibold text-gray-700">{inventoryStats.missingCount}</span> mã thiếu <span className="text-red-600 font-bold ml-1">({inventoryStats.missingQty})</span></div></div></div></CardContent></Card>) : null}
                <Card>
                  <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 gap-4"><div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-gray-800">Tổng hợp kiểm kê ({inventoryReportData.length})</h3></div><div className="flex flex-wrap items-center gap-2 w-full md:w-auto"><div className="relative flex-grow md:flex-grow-0"><Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" /><input type="text" placeholder="Tìm Mã SP..." value={filterInventorySku} onChange={(e) => setFilterInventorySku(e.target.value)} className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 w-full md:w-48" /></div><select value={filterInventoryStatus} onChange={(e) => setFilterInventoryStatus(e.target.value)} className="py-2 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-purple-500"><option value="">Tất cả trạng thái</option><option value="excess">Chỉ hiện mã Thừa (+)</option><option value="missing">Chỉ hiện mã Thiếu (-)</option><option value="exact">Chỉ hiện mã Đủ (0)</option></select><button onClick={handleExportInventory} disabled={inventoryReportData.length === 0} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${inventoryReportData.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}><Download className="w-4 h-4" />Xuất Excel</button></div></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                        <tr>
                          <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleInventorySort('sku')}>
                            <div className="flex items-center gap-1">
                              Mã Sản Phẩm 
                              {inventorySort.key === 'sku' ? (inventorySort.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-gray-500"/> : <ArrowDown className="w-3 h-3 text-gray-500"/>) : <ArrowUpDown className="w-3 h-3 text-gray-300"/>}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleInventorySort('diff')}>
                            <div className="flex items-center justify-center gap-1">
                              Tổng Thừa Thiếu
                              {inventorySort.key === 'diff' ? (inventorySort.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-gray-500"/> : <ArrowDown className="w-3 h-3 text-gray-500"/>) : <ArrowUpDown className="w-3 h-3 text-gray-300"/>}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-right">Ngày Kiểm Gần Nhất</th>
                        </tr>
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
                  {totalInventoryPages > 1 && (<div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50"><div className="text-sm text-gray-500">Trang <span className="font-medium">{inventoryPage}</span> / {totalInventoryPages}</div><div className="flex gap-2"><button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5 text-gray-600" /></button><button onClick={() => setInventoryPage(p => Math.min(totalInventoryPages, p + 1))} disabled={inventoryPage === totalInventoryPages} className="p-2 rounded-md hover:bg-white border hover:border-gray-200 disabled:opacity-50"><ChevronRight className="w-5 h-5 text-gray-600" /></button></div></div>)}
                </Card>
            </div>
        )}

        {activeTab === 'returns' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1"><CardHeader title="Báo cáo đơn hoàn" icon={Filter} /><CardContent className="h-64 flex flex-col items-center justify-center relative"><div className="absolute top-2 right-2 bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">Tổng: {returnReportData.totalUnique} đơn</div>{returnReportData.chartData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={returnReportData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><RechartsTooltip /><Legend verticalAlign="bottom" height={36}/><Bar dataKey="value" name="Số lượng đơn" onClick={(data) => data && setReturnFilterType(returnFilterType === data.name ? 'All' : data.name)} cursor="pointer">{returnReportData.chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} stroke={returnFilterType === entry.name ? '#000' : 'none'} strokeWidth={2} />))}<LabelList dataKey="value" position="top" /></Bar></BarChart></ResponsiveContainer>) : (<div className="text-gray-400 flex flex-col items-center"><AlertCircle className="mb-2" />Chưa có dữ liệu</div>)}<p className="text-xs text-gray-400 italic mt-2">* Nhấn vào cột để lọc bảng bên dưới</p></CardContent></Card>
                    <div className="md:col-span-2 grid grid-cols-1 gap-4">
                        <Card className="bg-gradient-to-r from-orange-50 to-white border-orange-100"><div className="p-6 flex items-center justify-between"><div><p className="text-sm font-bold text-orange-600 uppercase">Hoàn Shopee</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{returnReportData.chartData.find(d => d.name === 'Shopee')?.value || 0} <span className="text-sm text-gray-500 font-normal">đơn</span></h3></div><div className="p-3 bg-orange-100 rounded-full text-orange-600"><RefreshCcw className="w-6 h-6" /></div></div></Card>
                        <Card className="bg-gradient-to-r from-gray-50 to-white border-gray-200"><div className="p-6 flex items-center justify-between"><div><p className="text-sm font-bold text-gray-600 uppercase">Hoàn Tiktok</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{returnReportData.chartData.find(d => d.name === 'Tiktok')?.value || 0} <span className="text-sm text-gray-500 font-normal">đơn</span></h3></div><div className="p-3 bg-gray-200 rounded-full text-gray-700"><RefreshCcw className="w-6 h-6" /></div></div></Card>
                        <Card className="bg-gradient-to-r from-red-50 to-white border-red-100"><div className="p-6 flex items-center justify-between"><div><p className="text-sm font-bold text-red-600 uppercase">Hoàn BBBG (Lỗi)</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{returnReportData.chartData.find(d => d.name === 'BBBG')?.value || 0} <span className="text-sm text-gray-500 font-normal">đơn</span></h3></div><div className="p-3 bg-red-100 rounded-full text-red-600"><AlertCircle className="w-6 h-6" /></div></div></Card>
                    </div>
                </div>
                <Card>
                    <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-100 gap-4"><div className="flex items-center gap-2"><RefreshCcw className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-800">Chi Tiết Hoàn {returnFilterType !== 'All' ? `(${returnFilterType})` : ''} <span className="ml-2 text-sm font-normal text-gray-500">({returnReportData.tableData.length} dòng)</span></h3></div><div className="flex items-center gap-2 w-full md:w-auto"><div className="relative flex-grow md:flex-grow-0"><Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" /><input type="text" placeholder="Tìm Mã đơn, Sản phẩm..." value={returnSearchTerm} onChange={(e) => setReturnSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-full md:w-64" /></div><button onClick={handleExportReturn} disabled={returnReportData.tableData.length === 0} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${returnReportData.tableData.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}><Download className="w-4 h-4" />Xuất Excel</button></div></div>
                    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-600 uppercase text-xs"><tr><th className="px-6 py-3">Nguồn</th><th className="px-6 py-3">Mã Đơn / Vận Đơn</th><th className="px-6 py-3">Sản phẩm</th><th className="px-4 py-3 text-center">SL</th><th className="px-6 py-3">Ngày (BBBG)</th></tr></thead><tbody className="divide-y divide-gray-100">{currentReturnTableData.map((row, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold text-white ${row.source === 'Shopee' ? 'bg-orange-500' : row.source === 'Tiktok' ? 'bg-gray-800' : 'bg-red-600'}`}>{row.source}</span></td><td className="px-6 py-3 font-mono text-blue-600">{row.code}</td><td className="px-6 py-3 text-gray-700 max-w-xs truncate" title={row.product}>{row.product}</td><td className="px-4 py-3 text-center font-bold">{row.qty}</td><td className="px-6 py-3 text-gray-500 text-xs">{row.date}</td></tr>))}{currentReturnTableData.length === 0 && (<tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Không có dữ liệu phù hợp</td></tr>)}</tbody></table></div>
                    {totalReturnPages > 1 && (<div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50"><div className="text-sm text-gray-500">Trang {returnPage} / {totalReturnPages}</div><div className="flex gap-2"><button onClick={() => setReturnPage(p => Math.max(1, p - 1))} disabled={returnPage === 1} className="p-2 rounded-md hover:bg-white border disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button><button onClick={() => setReturnPage(p => Math.min(totalReturnPages, p + 1))} disabled={returnPage === totalReturnPages} className="p-2 rounded-md hover:bg-white border disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button></div></div>)}
                </Card>
            </div>
        )}

      </div>
    </div>
  );
};

export default MainApp;
