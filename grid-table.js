$(function() {

  /**
   * 初期処理
   * ・テーブルに識別用の属性を付与
   * ・テーブルに検索用テキストボックスを追加
   * ・ヘッダに昇順降順の矢印を追加
   * ・ヘッダに列移動の矢印を追加
   * ・ヘッダにドラッグ属性を付与
   */
  {

    $("table.grid-table").each(function(i, e) {
      // テーブルに識別用の属性を付与
      $(e).attr("data-table-id", i);

      // テーブルに検索用テキストボックスを追加(テーブルとの関連付けも行う)
      let $div = $("<div style='line-height: 2.0; vertical-align: middle;'>").text("検索：");
      let $input = $("<input type='text' size='15'>").attr("name", "search").attr("data-table-id", i);
      let $filter = $div.append($input);

      $filter.insertBefore($(e));
    });

    $("table.grid-table thead th").each(function(i, e) {
      // ヘッダに昇順降順の矢印を追加
      let $sortLinkAsc = $("<a href='javascript:void(0)'>").text("↑").attr("data-sort", "asc");
      let $sortLinkDesc = $("<a href='javascript:void(0)'>").text("↓").attr("data-sort", "desc");
      // ヘッダに列移動の矢印を追加
      let $colMoveLinkRight = $("<a href='javascript:void(0)'>").text("→").attr("data-col-move", "right");
      let $colMoveLinkLeft = $("<a href='javascript:void(0)'>").text("←").attr("data-col-move", "left");

      // 要素の追加
      $(e).append(" ", $colMoveLinkLeft);
      $(e).append(" ", $sortLinkAsc);
      $(e).append(" ", $sortLinkDesc);
      $(e).append(" ", $colMoveLinkRight);

      // ヘッダにドラッグ属性を付与
      $(e).attr("draggable", true)
    });

  }

  /**
   * セルダブルクリック
   * ・値編集
   */
  $("table.grid-table tbody tr td").dblclick(function() {
    let val = prompt("値を入力してください", $(this).text());
    if (val != null) {
      $(this).text(val);
    }
  });

  /**
   * 検索ボックス入力
   * ・レコードのフィルタ
   */
  $("input[name='search']").keyup(function(e) {
    // 対象テーブルの取得
    let targetId = $(this).attr("data-table-id");
    let $targetTable = $("table.grid-table[data-table-id=" + targetId + "]");

    // 検索ボックスの値を取得
    let value = $(this).val();

    // レコード単位で判定
    let $trRecords = $targetTable.find("tbody tr");
    $trRecords.each(function(i, e) {
      if ($(e).text().indexOf(value) == -1) { // ちょっぴり手抜き・・・でも大体のケースはOK
        $(e).hide();
      } else {
        $(e).show();
      }
    });
  });

  /**
   * ↑↓クリック
   * ・行ソート
   */
  $("table.grid-table thead th a[data-sort]").on("click", function() {
    // 対象テーブル、列番号、昇順降順の取得
    let $targetTable = $(this).parents("table.grid-table");
    let colIndex = $(this).parent().index();
    let sort = $(this).attr("data-sort");

    // 行レコードのソート
    let $records = $targetTable.find("tbody tr");
    $records.sort(function(a, b) {
      let aVal = $(a).children("td").eq(colIndex).text();
      let bVal = $(b).children("td").eq(colIndex).text();

      let comp = fnc_compare(aVal, bVal, sort);
      if (comp == -1) {
        $(a).insertBefore($(b));
      } else if (comp == 1) {
        $(a).insertAfter($(b));
      }
      return comp;
    });
  });

  /**
   * ←→クリック
   * ・列の移動
   */
  $("table.grid-table thead th a[data-col-move]").on("click", function() {
    // 対象テーブル、列番号、列移動の取得
    let $targetTable = $(this).parents("table.grid-table");
    let colIndex = $(this).parent().index();
    let colMove = $(this).attr("data-col-move");

    // 移動元列番号と移動先列番号を生成
    let srcColIndex = colIndex;
    let distColIndex;
    if (colMove == "right") distColIndex = colIndex + 1;
    if (colMove == "left") distColIndex = colIndex - 1;

    // 列移動処理
    fnc_colMove($targetTable, srcColIndex, distColIndex);
  });

  /**
   * ヘッダのドラッグ開始
   * ・ドラッグ要素の記憶
   */
  $("table.grid-table thead th").on("dragstart", function(_e) {
    let e = _e.originalEvent;

    // ドラッグ要素のテーブルIDと列番号を格納
    let tableId = $(e.target).parents("table.grid-table").attr("data-table-id");
    e.dataTransfer.setData("srcTableId", tableId);
    e.dataTransfer.setData("srcColIndex", $(e.target).index());
  });

  /**
   * ヘッダのドロップ先と要素が重なった時
   * ・ドロップ処理実行の為に処理をキャンセル
   */
  $("table.grid-table thead th").on("dragover", function(_e) {
    let e = _e.originalEvent;
    e.stopPropagation();
    e.preventDefault();
  });

  /**
   * ヘッダのドロップ
   * ・列の移動
   */
  $("table.grid-table thead th").on("drop", function(_e) {
    let e = _e.originalEvent;
    e.stopPropagation();
    e.preventDefault();

    // 移動元要素のテーブルと列番号を取得
    let srcTableId = e.dataTransfer.getData("srcTableId");
    let $targetTable = $("table.grid-table[data-table-id=" + srcTableId + "]");
    let srcColIndex = e.dataTransfer.getData("srcColIndex");

    // 移動先要素の列番号を取得
    let distColIndex = $(e.currentTarget).index();

    // 列移動処理
    fnc_colMove($targetTable, srcColIndex, distColIndex);
  });

  /**
   * 比較処理
   * (文字列と数値を判別して比較)
   */
  function fnc_compare(aVal, bVal, sort) {
    if (sort == "asc") {
      if (isNaN(aVal) || isNaN(bVal)) {
        // 文字列の場合
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      } else {
        // 数値の場合
        if (parseInt(aVal) < parseInt(bVal)) return -1;
        if (parseInt(aVal) > parseInt(bVal)) return 1;
      }
    } else if (sort == "desc") {
      if (isNaN(aVal) || isNaN(bVal)) {
        // 文字列の場合
        if (aVal < bVal) return 1;
        if (aVal > bVal) return -1;
      } else {
        // 数値の場合
        if (parseInt(aVal) < parseInt(bVal)) return 1;
        if (parseInt(aVal) > parseInt(bVal)) return -1;
      }
    }
    return 0;
  }

  /**
   * 列移動処理
   */
  function fnc_colMove($targetTable, srcColIndex, distColIndex) {

    // 処理の実行有無を判定
    let colMax = $targetTable.find("thead th").length;
    if (distColIndex < 0 || distColIndex > colMax - 1 || srcColIndex == distColIndex) {
      // 列の移動先がマイナス、又は、列数を超えている、又は、値が同じ場合は処理しない
      return;
    }

    // ヘッダの移動
    let $thRecords = $targetTable.find("thead th");
    if (srcColIndex < distColIndex) {
      $thRecords.eq(distColIndex).after($thRecords.eq(srcColIndex));
    } else {
      $thRecords.eq(distColIndex).before($thRecords.eq(srcColIndex));
    }

    // 明細の移動
    let $trRecords = $targetTable.find("tbody tr");
    $trRecords.each(function(i, e) {
      let $tdRecords = $(e).children("td");
      if (srcColIndex < distColIndex) {
        $tdRecords.eq(distColIndex).after($tdRecords.eq(srcColIndex));
      } else {
        $tdRecords.eq(distColIndex).before($tdRecords.eq(srcColIndex));
      }
    });
  }
});
