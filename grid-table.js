$(function() {

  /**
   * 初期処理
   * ・ヘッダに昇順降順の矢印を追加
   * ・ヘッダに列移動の矢印を追加
   * ・ヘッダにドラッグ属性を付与
   * ・テーブルの上部に検索用テキストボックスを追加
   */
  {
    $("table.grid-table thead th").each(function(i, e) {
      // ヘッダに昇順降順の矢印を追加
      let $sortLinkAsc = $("<a href='javascript:void(0)' data-sort='asc'>↑</a>");
      let $sortLinkDesc = $("<a href='javascript:void(0)' data-sort='desc'>↓</a>");
      // ヘッダに列移動の矢印を追加
      let $colMoveLinkRight = $("<a href='javascript:void(0)' data-col-move='right'>→</a>");
      let $colMoveLinkLeft = $("<a href='javascript:void(0)' data-col-move='left'>←</a>");

      // 要素の追加
      $(e).append(" ", $colMoveLinkLeft);
      $(e).append(" ", $sortLinkAsc);
      $(e).append(" ", $sortLinkDesc);
      $(e).append(" ", $colMoveLinkRight);

      // ヘッダにドラッグ属性を付与
      $(e).attr("draggable", true)
    });

    // テーブルの上部に検索用テキストボックスを追加
    let $filter = $("<div style='line-height: 2.0; vertical-align: middle;'>フィルタ：<input type='text' id='search' style='width: 15em;' /><div>");
    $filter.insertBefore($("table.grid-table"));
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
   * フィルタ入力
   * ・レコードのフィルタ
   */
  $("#search").keyup(function(e) {
    let value = $("#search").val();
    let $trRecords = $("table.grid-table tbody tr");

    // レコード単位で判定
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
    // 列番号の取得
    let colIndex = $(this).parent().index();
    // 昇順降順の取得
    let sort = $(this).attr("data-sort");

    // 行レコードのソート
    let $records = $("table.grid-table tbody tr");
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
    // 列番号の取得
    let colIndex = $(this).parent().index();
    // 列移動の取得
    let colMove = $(this).attr("data-col-move");

    // 移動元列番号と移動先列番号を生成
    let srcColIndex = colIndex;
    let distColIndex;
    if (colMove == "right") distColIndex = colIndex + 1;
    if (colMove == "left") distColIndex = colIndex - 1;

    // 列移動処理
    fnc_colMove(srcColIndex, distColIndex);
  });

  /**
   * ヘッダのドラッグ開始
   * ・ドラッグ要素の記憶
   */
  $("table.grid-table thead th").on("dragstart", function(_e) {
    let e = _e.originalEvent;

    // ドラッグ要素の列番号を格納
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

    // 移動元列番号と移動先列番号を生成
    let srcColIndex = e.dataTransfer.getData("srcColIndex");
    let distColIndex = $(e.currentTarget).index();

    // 列移動処理
    fnc_colMove(srcColIndex, distColIndex);
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
  function fnc_colMove(srcColIndex, distColIndex) {

    // 処理の実行有無を判定
    let colMax = $("table.grid-table thead th").length;
    if (distColIndex < 0 || distColIndex > colMax - 1 || srcColIndex == distColIndex) {
      // 列の移動先がマイナス、又は、列数を超えている、又は、値が同じ場合は処理しない
      return;
    }

    // ヘッダの移動
    let $thRecords = $("table.grid-table thead th");
    if (srcColIndex < distColIndex) {
      $thRecords.eq(distColIndex).after($thRecords.eq(srcColIndex));
    } else {
      $thRecords.eq(distColIndex).before($thRecords.eq(srcColIndex));
    }
    // 明細の移動
    let $trRecords = $("table.grid-table tbody tr");
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
