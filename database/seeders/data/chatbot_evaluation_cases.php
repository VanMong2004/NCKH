<?php

return [
    [
        'key' => 'product_shirt_search',
        'label' => 'Tìm áo CTUT',
        'messages' => [
            [
                'input' => 'Shop có bán áo CTUT không?',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Áo thun CTUT K2026', 'Áo khoa CNTT', 'Áo khoa Cơ khí', 'Áo khoa Điện - Điện tử'],
                    'products_min' => 4,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_generic_short_query',
        'label' => 'Câu ngắn hỏi áo',
        'messages' => [
            [
                'input' => 'co ban ao k',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Áo khoa', 'Áo thun CTUT K2026'],
                    'products_min' => 3,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_gift_suggestion',
        'label' => 'Gợi ý quà tặng',
        'messages' => [
            [
                'input' => 'Tôi muốn tìm sản phẩm làm quà tặng',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Túi tote CTUT', 'Ly giữ nhiệt CTUT', 'Móc khóa CTUT', 'Sticker CTUT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_gift_typo_query',
        'label' => 'Gợi ý quà tặng viết ngắn',
        'messages' => [
            [
                'input' => 'qua tang',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_tote_search',
        'label' => 'Tìm túi tote',
        'messages' => [
            [
                'input' => 'shop co tui tote khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Túi tote CTUT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_sticker_search',
        'label' => 'Tìm sticker',
        'messages' => [
            [
                'input' => 'co ban sticker ctut khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Sticker CTUT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_price_query',
        'label' => 'Hỏi giá áo thun CTUT',
        'messages' => [
            [
                'input' => 'gia ao thun ctut k2026',
                'expect' => [
                    'intent_in' => ['product_price'],
                    'answer_contains_any' => ['149.000 đ', 'Giá hiện tại của Áo thun CTUT K2026'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_stock_query',
        'label' => 'Hỏi tồn kho sticker',
        'messages' => [
            [
                'input' => 'sticker ctut con hang khong',
                'expect' => [
                    'intent_in' => ['product_stock', 'product_search'],
                    'answer_contains_any' => ['Sticker CTUT', 'còn'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_variant_query',
        'label' => 'Hỏi biến thể áo khoa CNTT',
        'messages' => [
            [
                'input' => 'ao khoa cntt co size nao',
                'expect' => [
                    'intent_in' => ['product_variant', 'product_search'],
                    'answer_contains_any' => ['Áo khoa CNTT hiện có các biến thể', 'S', 'M', 'L', 'XL'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_color_query',
        'label' => 'Hỏi màu áo khoa điện',
        'messages' => [
            [
                'input' => 'ao khoa dien dien tu co mau gi',
                'expect' => [
                    'intent_in' => ['product_variant', 'product_search'],
                    'answer_contains_any' => ['Áo khoa Điện - Điện tử', 'Trắng', 'Xanh Navy'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_follow_up_price',
        'label' => 'Follow-up hỏi giá sau khi tìm áo',
        'messages' => [
            [
                'input' => 'shop co ban ao ctut khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'products_min' => 4,
                ],
            ],
            [
                'input' => 'san pham 1 gia bao nhieu',
                'expect' => [
                    'intent_in' => ['product_price'],
                    'answer_contains_any' => ['149.000 đ', 'Giá hiện tại của Áo thun CTUT K2026'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_follow_up_stock',
        'label' => 'Follow-up hỏi tồn kho sau khi tìm áo',
        'messages' => [
            [
                'input' => 'shop co ban ao ctut khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'products_min' => 4,
                ],
            ],
            [
                'input' => 'san pham 4 con hang khong',
                'expect' => [
                    'intent_in' => ['product_stock', 'product_search'],
                    'answer_contains_any' => ['còn', 'Áo khoa CNTT', 'Áo khoa Điện - Điện tử', 'Áo khoa Cơ khí'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_typo_mixed_query',
        'label' => 'Câu gõ sai có áo',
        'messages' => [
            [
                'input' => 'khueyn ,ao',
                'expect' => [
                    'intent_in' => ['product_search', 'promotion_query', 'clarify'],
                    'answer_contains_any' => ['Áo thun CTUT K2026', 'Áo khoa'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_lanyard_search',
        'label' => 'Tìm dây đeo thẻ',
        'messages' => [
            [
                'input' => 'co day deo the ctut khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Dây đeo thẻ CTUT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_notebook_search',
        'label' => 'Tìm sổ tay',
        'messages' => [
            [
                'input' => 'shop co so tay khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Sổ tay CTUT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_pen_search',
        'label' => 'Tìm bút',
        'messages' => [
            [
                'input' => 'co but ctut khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Bút CTUT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_cap_search',
        'label' => 'Tìm nón',
        'messages' => [
            [
                'input' => 'co non luoi trai ctut khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Nón lưỡi trai CTUT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_keychain_search',
        'label' => 'Tìm móc khóa',
        'messages' => [
            [
                'input' => 'co moc khoa ctut khong',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Móc khóa CTUT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_department_query',
        'label' => 'Tìm áo khoa CNTT',
        'messages' => [
            [
                'input' => 'ao khoa cntt',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Áo khoa CNTT'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_department_mechanical_query',
        'label' => 'Tìm áo khoa cơ khí',
        'messages' => [
            [
                'input' => 'ao khoa co khi',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Áo khoa Cơ khí'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'product_department_electrical_query',
        'label' => 'Tìm áo khoa điện',
        'messages' => [
            [
                'input' => 'ao khoa dien',
                'expect' => [
                    'intent_in' => ['product_search', 'clarify'],
                    'answer_contains_any' => ['Áo khoa Điện - Điện tử'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_active_list',
        'label' => 'Danh sách khuyến mãi hiện có',
        'messages' => [
            [
                'input' => 'khuyen mai',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'answer_contains_all' => ['Flash Sale cuối tuần CTUT', 'Chào tân sinh viên K2026'],
                    'promotions_min' => 2,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_full_phrase',
        'label' => 'Các đợt khuyến mãi hiện có',
        'messages' => [
            [
                'input' => 'cac dot khuyen mai hien co',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'answer_contains_all' => ['Flash Sale cuối tuần CTUT', 'Chào tân sinh viên K2026'],
                    'promotions_min' => 2,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_short_phrase',
        'label' => 'Từ khóa khuyến mãi ngắn',
        'messages' => [
            [
                'input' => 'cac dot khuyen mai',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'promotions_min' => 2,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_ordinal_first',
        'label' => 'Sản phẩm trong khuyến mãi số 1',
        'messages' => [
            [
                'input' => 'khuyen mai',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'promotions_min' => 2,
                ],
            ],
            [
                'input' => 'cac san pham trong khuyen mai 1',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'answer_contains_all' => ['Flash Sale cuối tuần CTUT', 'Sticker CTUT'],
                    'products_min' => 3,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_ordinal_second',
        'label' => 'Sản phẩm trong khuyến mãi số 2',
        'messages' => [
            [
                'input' => 'khuyen mai',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'promotions_min' => 2,
                ],
            ],
            [
                'input' => 'cac san pham trong khuyen mai 2',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'answer_contains_any' => ['Chào tân sinh viên K2026', 'Áo thun CTUT K2026', 'Hoodie CTUT Premium', 'Túi tote CTUT'],
                    'answer_not_contains' => ['Flash Sale cuối tuần CTUT'],
                    'products_min' => 3,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_follow_up_general',
        'label' => 'Follow-up sau khuyến mãi',
        'messages' => [
            [
                'input' => 'khuyen mai',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'promotions_min' => 2,
                ],
            ],
            [
                'input' => 'cac san pham trong dot khuyen mai 1',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'answer_contains_any' => ['Flash Sale cuối tuần CTUT', 'Sticker CTUT', 'Ly giữ nhiệt CTUT'],
                    'products_min' => 3,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_product_follow_up_name',
        'label' => 'Follow-up tên chương trình',
        'messages' => [
            [
                'input' => 'khuyen mai',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'promotions_min' => 2,
                ],
            ],
            [
                'input' => 'san pham trong flash sale cuoi tuan ctut',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'answer_contains_any' => ['Flash Sale cuối tuần CTUT', 'Sticker CTUT'],
                    'products_min' => 3,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_sticker_stock_after_list',
        'label' => 'Sticker sau danh sách khuyến mãi vẫn còn hàng',
        'messages' => [
            [
                'input' => 'khuyen mai',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'promotions_min' => 2,
                ],
            ],
            [
                'input' => 'cac san pham trong khuyen mai 1',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'products_min' => 3,
                ],
            ],
            [
                'input' => 'sticker con hang khong',
                'expect' => [
                    'intent_in' => ['product_stock', 'product_search'],
                    'answer_contains_any' => ['Sticker CTUT', 'còn'],
                    'products_min' => 1,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_items_flash_sale_name',
        'label' => 'Sản phẩm trong Flash Sale',
        'messages' => [
            [
                'input' => 'san pham trong flash sale cuoi tuan ctut',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'answer_contains_any' => ['Ly giữ nhiệt CTUT', 'Sticker CTUT', 'Bảng tên sinh viên CTUT'],
                    'products_min' => 3,
                ],
            ],
        ],
    ],
    [
        'key' => 'promotion_items_welcome_name',
        'label' => 'Sản phẩm trong Chào tân sinh viên',
        'messages' => [
            [
                'input' => 'san pham trong chao tan sinh vien k2026',
                'expect' => [
                    'intent_in' => ['promotion_query'],
                    'answer_contains_any' => ['Áo thun CTUT K2026', 'Hoodie CTUT Premium', 'Túi tote CTUT'],
                    'products_min' => 3,
                ],
            ],
        ],
    ],
    [
        'key' => 'policy_shipping',
        'label' => 'Chính sách vận chuyển',
        'messages' => [
            [
                'input' => 'chinh sach van chuyen',
                'expect' => [
                    'intent_in' => ['static_knowledge'],
                    'answer_contains_any' => ['giao tận nơi', 'nhận trực tiếp tại trường', 'phí vận chuyển'],
                ],
            ],
        ],
    ],
    [
        'key' => 'policy_shipping_short',
        'label' => 'Vận chuyển ngắn',
        'messages' => [
            [
                'input' => 'van chuyen',
                'expect' => [
                    'intent_in' => ['static_knowledge', 'clarify'],
                    'answer_not_contains' => ['Không tìm thấy đơn hàng'],
                ],
            ],
        ],
    ],
    [
        'key' => 'policy_return',
        'label' => 'Chính sách đổi trả',
        'messages' => [
            [
                'input' => 'Chính sách đổi trả như thế nào?',
                'expect' => [
                    'intent_in' => ['static_knowledge'],
                    'answer_contains_any' => ['đổi trả', 'sản phẩm bị lỗi', 'mã đơn hàng'],
                ],
            ],
        ],
    ],
    [
        'key' => 'policy_buying_guide',
        'label' => 'Hướng dẫn mua hàng ngắn',
        'messages' => [
            [
                'input' => 'mua hang',
                'expect' => [
                    'intent_in' => ['static_knowledge', 'clarify'],
                    'answer_not_contains' => ['Mình chưa rõ bạn muốn hỏi sản phẩm nào'],
                ],
            ],
        ],
    ],
    [
        'key' => 'policy_buying_guide_full',
        'label' => 'Hướng dẫn mua hàng đầy đủ',
        'messages' => [
            [
                'input' => 'huong dan mua hang',
                'expect' => [
                    'intent_in' => ['static_knowledge'],
                    'answer_contains_any' => ['thêm vào giỏ', 'xác nhận đặt đơn', 'theo dõi trạng thái'],
                ],
            ],
        ],
    ],
    [
        'key' => 'small_talk_greeting',
        'label' => 'Chào hỏi',
        'messages' => [
            [
                'input' => 'xin chao',
                'expect' => [
                    'intent_in' => ['small_talk'],
                    'answer_contains_any' => ['Chào bạn', 'CTUT UniShop'],
                ],
            ],
        ],
    ],
    [
        'key' => 'small_talk_intro',
        'label' => 'Hỏi chatbot là ai',
        'messages' => [
            [
                'input' => 'ban la ai',
                'expect' => [
                    'intent_in' => ['small_talk', 'static_knowledge'],
                    'answer_contains_any' => ['CTUT UniShop', 'trợ lý'],
                ],
            ],
        ],
    ],
    [
        'key' => 'small_talk_thanks',
        'label' => 'Cảm ơn',
        'messages' => [
            [
                'input' => 'cam on nha',
                'expect' => [
                    'intent_in' => ['small_talk'],
                    'answer_contains_any' => ['mình', 'CTUT UniShop', 'vui'],
                ],
            ],
        ],
    ],
    [
        'key' => 'off_topic_food',
        'label' => 'Ngoài phạm vi - phở',
        'messages' => [
            [
                'input' => 'co ban pho k',
                'expect' => [
                    'intent_in' => ['off_topic'],
                    'answer_contains_any' => ['CTUT UniShop hiện chưa hỗ trợ', 'Bạn có thể hỏi mình về các sản phẩm CTUT'],
                ],
            ],
        ],
    ],
    [
        'key' => 'off_topic_weather',
        'label' => 'Ngoài phạm vi - thời tiết',
        'messages' => [
            [
                'input' => 'hom nay troi mua khong',
                'expect' => [
                    'intent_in' => ['off_topic', 'clarify'],
                    'answer_contains_any' => ['CTUT UniShop', 'sản phẩm CTUT', 'ngoài phạm vi'],
                ],
            ],
        ],
    ],
    [
        'key' => 'guest_order_lookup_token_direct',
        'label' => 'Tra cứu đơn guest bằng mã tra cứu',
        'messages' => [
            [
                'input' => 'Mã tra cứu đơn GLK-EVAL-00001 của tôi còn hiệu lực không?',
                'expect' => [
                    'intent_in' => ['order_query'],
                    'answer_contains_any' => ['ORD-EVAL-00001', 'pending', 'unpaid'],
                ],
            ],
        ],
    ],
    [
        'key' => 'guest_order_code_direct',
        'label' => 'Tra cứu đơn bằng mã đơn',
        'messages' => [
            [
                'input' => 'kiem tra don ORD-EVAL-00002',
                'expect' => [
                    'intent_in' => ['order_query'],
                    'answer_contains_any' => ['ORD-EVAL-00002', 'awaiting_receipt', 'paid'],
                ],
            ],
        ],
    ],
    [
        'key' => 'guest_order_code_pending',
        'label' => 'Tra cứu mã đơn pending',
        'messages' => [
            [
                'input' => 'don hang ORD-EVAL-00001 cua toi sao roi',
                'expect' => [
                    'intent_in' => ['order_query'],
                    'answer_contains_any' => ['ORD-EVAL-00001', 'pending', 'unpaid'],
                ],
            ],
        ],
    ],
    [
        'key' => 'guest_order_code_completed',
        'label' => 'Tra cứu mã đơn completed',
        'messages' => [
            [
                'input' => 'don ORD-EVAL-00003 da xong chua',
                'expect' => [
                    'intent_in' => ['order_query'],
                    'answer_contains_any' => ['ORD-EVAL-00003', 'completed', 'paid'],
                ],
            ],
        ],
    ],
];
