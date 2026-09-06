-- Collections are additive: dropping them restores the pre-007 catalogue
-- exactly. collection_products goes first for clarity, though the CASCADE on
-- collections would take it anyway.

DROP TABLE IF EXISTS collection_products;
DROP TABLE IF EXISTS collections;
