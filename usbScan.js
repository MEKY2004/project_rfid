const usb = require("usb")

const devices = usb.getDeviceList()
devices.forEach((device, index) => {
  const desc = device.deviceDescriptor
  console.log(`🔌 Device ${index + 1}:`)
  console.log(`  Vendor ID: ${desc.idVendor.toString(16)}`)
  console.log(`  Product ID: ${desc.idProduct.toString(16)}`)
  console.log(`  Manufacturer Index: ${desc.iManufacturer}`)
  console.log(`  Product Index: ${desc.iProduct}`)
  console.log(`  Serial Number Index: ${desc.iSerialNumber}`)
})