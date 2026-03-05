// （保留文件开头与原有逻辑不变，只展示需要新增/替换的展开区域部分）
// 在原来 relatedGroups 渲染处下面，添加 Optional extensions 的显示逻辑：

{expandedItems[item.id] && (
  <div className="mt-3 space-y-3 animate-fade-in-up">
    {item.relatedGroups.map((group, idx) => (
      <div key={idx} className="bg-white p-4 rounded-lg border border-blue-50 shadow-sm">
        <div className="text-xs font-bold text-blue-800 mb-3 bg-blue-50 inline-block px-2 py-1 rounded">
          {group.groupName}
        </div>
        <div className="space-y-3">
          {group.items && group.items.map((gItem, iIdx) => (
            <div key={iIdx} className="text-sm mb-2">
              <div className="font-medium text-slate-800">
                {gItem.phrase}
                {gItem.phraseZh && <span className="text-slate-500 font-normal ml-2">({gItem.phraseZh})</span>}
              </div>
              {gItem.example && (
                <div className="mt-1 border-l-2 border-blue-200 pl-2 ml-1">
                  <div className="text-gray-500 italic">"{gItem.example}"</div>
                  {gItem.exampleZh && <div className="text-gray-400 text-xs mt-0.5">{gItem.exampleZh}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    ))}

    {/* 新增：Optional extensions（可选延展）显示 */}
    {item.optionalExtensions && item.optionalExtensions.length > 0 && (
      <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
        <div className="text-xs font-semibold text-gray-600 mb-2">Optional extensions — 可选延展</div>
        <div className="flex flex-wrap gap-2">
          {item.optionalExtensions.map((opt, i) => (
            <div key={i} className="px-3 py-2 bg-white border border-gray-100 rounded text-sm shadow-sm">
              <div className="font-medium text-slate-800">{opt.phrase}</div>
              {opt.phraseZh && <div className="text-xs text-slate-500 mt-0.5">({opt.phraseZh})</div>}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}