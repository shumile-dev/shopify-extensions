import {
  reactExtension,
  Banner,
  useApi,
  useApplyAttributeChange,
  useInstructions,
  useTranslate,
  useCartLines,
  useApplyCartLinesChange,
  useTotalAmount,
  useDiscountCodes,
  useApplyDiscountCodeChange
} from "@shopify/ui-extensions-react/checkout";

import { useState, useEffect } from "react";

// 1. Choose an extension target
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {

  const [discountCodeHasApplied, setDiscountCodeHasApplied] = useState(false);
  const [hasFreeProduct, setHasFreeProduct] = useState(false);
  const translate = useTranslate();
  const { extension } = useApi();
  const instructions = useInstructions();
  const applyAttributeChange = useApplyAttributeChange();
  const cartLines = useCartLines();

  console.log("Cart lines", cartLines)


  const changeCartLine = useApplyCartLinesChange();
  const totalAmount = useTotalAmount();
  const discountCodes = useDiscountCodes();
  const applyDiscountChange = useApplyDiscountCodeChange();

  async function applyDiscount(threshold) {
    if (totalAmount.amount > threshold) {
      console.log("applying discount")
      await applyDiscountChange({
        "code": "BFCM",
        "type": "addDiscountCode"
      })
    }
  }

  async function removeFreeGift() {
    const freeGiftCartLine = cartLines.find(cartLine =>
      cartLine.attributes.some(attr => attr.key === "type" && attr.value === "free-gift")
    );
    if (freeGiftCartLine) {
      try {
        await changeCartLine({
          "id": `${freeGiftCartLine.id}`,
          "quantity": 1,
          "type": "removeCartLine"
        })
        setHasFreeProduct(false)
      }
      catch(error) {
        console.error("Error while removing free gift")
      }
    }
  }

  
  async function addFreeGift(threshold) {
    const hasFreeGift = cartLines.some((cartLine) =>
      cartLine.attributes.some((attr) => attr.value === "free-gift")
    );
    if (!hasFreeGift) {
      if (totalAmount.amount > threshold && !hasFreeProduct) {
        try {
          await changeCartLine({
            "merchandiseId": 'gid://shopify/ProductVariant/51701071708524',
            "quantity": 1,
            "type": "addCartLine",
            "attributes": [
              {key: "type", value: "free-gift"}
            ]
          })
          setHasFreeProduct(true)
        }
        catch(error) {
          console.error("Error while adding free gift")
        }
      }
    }
  }


  useEffect(() => {
    applyDiscount(3000);
  }, [])

  useEffect(() => {

    const hasBfcmCode = discountCodes.some((discountCode) => discountCode.code == "BFCM");

    if (hasBfcmCode) {
      addFreeGift(300)
    } else {
      removeFreeGift()
    }
  }, [discountCodes.length])



  if (discountCodes.length > 0) {
    return (
      <Banner status="success" title="Discount Code Applied" />
    )
  } else {
    return (
      <Banner status="info" title="No discount applied" />
    )
  }

}
