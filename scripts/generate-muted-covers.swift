import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let artifactDir = "/Users/jib/.gemini/antigravity/brain/1311d1d4-d1eb-45a7-8bf3-d8fe3d5c0d73"
let marathonOutDir = "/Users/jib/projects/AlgoVault/src/assets/images/marathons/covers"
let categoryOutDir = "/Users/jib/projects/AlgoVault/src/assets/images/categories/covers"

try FileManager.default.createDirectory(atPath: marathonOutDir, withIntermediateDirectories: true)
try FileManager.default.createDirectory(atPath: categoryOutDir, withIntermediateDirectories: true)

// Ordered list of AI-generated base banners (9 muted banners first, then 4 original AI banners)
let baseFiles = [
  "\(artifactDir)/muted_banner_1_1794509360295.jpg",
  "\(artifactDir)/muted_banner_5_1794509353410.jpg",
  "\(artifactDir)/muted_banner_6_1794509377181.jpg",
  "\(artifactDir)/muted_banner_2_1794509402286.jpg",
  "\(artifactDir)/muted_banner_9_1794509347835.jpg",
  "\(artifactDir)/muted_banner_10_1794509372700.jpg",
  "\(artifactDir)/muted_banner_13_1794509346072.jpg",
  "\(artifactDir)/muted_banner_14_1794509367611.jpg",
  "\(artifactDir)/muted_banner_15_1794509402286.jpg",
  "\(artifactDir)/ai_banner_1_1794506238228.jpg",
  "\(artifactDir)/ai_banner_2_1794506267325.jpg",
  "\(artifactDir)/ai_banner_3_1794506301133.jpg",
  "\(artifactDir)/ai_banner_4_1794506338171.jpg",
]

struct LoadedImage {
  let cgImage: CGImage
  let width: Int
  let height: Int
  let bytes: [UInt8]
}

func loadCGImage(at path: String) -> LoadedImage? {
  guard FileManager.default.fileExists(atPath: path),
        let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
        let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
    return nil
  }
  let width = cg.width
  let height = cg.height
  let bytesPerRow = width * 4
  var buffer = [UInt8](repeating: 0, count: height * bytesPerRow)
  let colorSpace = CGColorSpaceCreateDeviceRGB()
  let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
  guard let ctx = CGContext(
    data: &buffer,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: colorSpace,
    bitmapInfo: bitmapInfo
  ) else {
    return nil
  }
  ctx.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height))
  return LoadedImage(cgImage: cg, width: width, height: height, bytes: buffer)
}

func saveJPEG(cgImage: CGImage, to path: String) -> Bool {
  guard let dst = CGImageDestinationCreateWithURL(
    URL(fileURLWithPath: path) as CFURL,
    UTType.jpeg.identifier as CFString,
    1,
    nil
  ) else {
    return false
  }
  CGImageDestinationAddImage(dst, cgImage, [kCGImageDestinationLossyCompressionQuality: 0.85] as CFDictionary)
  return CGImageDestinationFinalize(dst)
}

func transformAndSave(
  base: LoadedImage,
  hueDegrees: Float,
  saturation: Float,
  brightness: Float,
  to path: String
) -> Bool {
  let width = base.width
  let height = base.height
  let totalPixels = width * height
  var outBytes = base.bytes

  // 3x3 hue rotation matrix in RGB space (approximated via Rodrigues' formula around (1,1,1)/sqrt(3))
  let angle = hueDegrees * Float.pi / 180.0
  let cosA = cos(angle)
  let sinA = sin(angle)
  let lumR: Float = 0.213
  let lumG: Float = 0.715
  let lumB: Float = 0.072

  // Combined saturation + hue matrix
  let m00 = lumR + cosA * (1 - lumR) + sinA * (-lumR)
  let m01 = lumG + cosA * (-lumG) + sinA * (-lumG)
  let m02 = lumB + cosA * (-lumB) + sinA * (1 - lumB)

  let m10 = lumR + cosA * (-lumR) + sinA * (0.143)
  let m11 = lumG + cosA * (1 - lumG) + sinA * (0.140)
  let m12 = lumB + cosA * (-lumB) + sinA * (-0.283)

  let m20 = lumR + cosA * (-lumR) + sinA * (-(1 - lumR))
  let m21 = lumG + cosA * (-lumG) + sinA * (lumG)
  let m22 = lumB + cosA * (1 - lumB) + sinA * (lumB)

  // Apply saturation blend with luminance, then brightness scale
  let invSat = 1.0 - saturation
  let a00 = invSat * lumR + saturation * m00
  let a01 = invSat * lumG + saturation * m01
  let a02 = invSat * lumB + saturation * m02

  let a10 = invSat * lumR + saturation * m10
  let a11 = invSat * lumG + saturation * m11
  let a12 = invSat * lumB + saturation * m12

  let a20 = invSat * lumR + saturation * m20
  let a21 = invSat * lumG + saturation * m21
  let a22 = invSat * lumB + saturation * m22

  let brightScale = 1.0 + brightness

  outBytes.withUnsafeMutableBufferPointer { ptr in
    for p in 0..<totalPixels {
      let idx = p * 4
      let r = Float(ptr[idx])
      let g = Float(ptr[idx + 1])
      let b = Float(ptr[idx + 2])

      let nr = (a00 * r + a01 * g + a02 * b) * brightScale
      let ng = (a10 * r + a11 * g + a12 * b) * brightScale
      let nb = (a20 * r + a21 * g + a22 * b) * brightScale

      ptr[idx] = UInt8(max(0, min(255, nr)))
      ptr[idx + 1] = UInt8(max(0, min(255, ng)))
      ptr[idx + 2] = UInt8(max(0, min(255, nb)))
    }
  }

  let colorSpace = CGColorSpaceCreateDeviceRGB()
  let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
  guard let provider = CGDataProvider(data: Data(outBytes) as CFData),
        let cgOut = CGImage(
          width: width,
          height: height,
          bitsPerComponent: 8,
          bitsPerPixel: 32,
          bytesPerRow: width * 4,
          space: colorSpace,
          bitmapInfo: CGBitmapInfo(rawValue: bitmapInfo),
          provider: provider,
          decode: nil,
          shouldInterpolate: true,
          intent: .defaultIntent
        ) else {
    return false
  }
  return saveJPEG(cgImage: cgOut, to: path)
}

let loadedImages: [LoadedImage] = baseFiles.compactMap(loadCGImage)
guard !loadedImages.isEmpty else {
  fputs("Error: No base images found in \(artifactDir)\n", stderr)
  exit(1)
}

var generatedCount = 0
for i in 0..<100 {
  let baseIdx = i % loadedImages.count
  let base = loadedImages[baseIdx]
  let outPath = String(format: "%@/marathon-%03d.jpg", marathonOutDir, i + 1)

  if i < 9 {
    // First 9 are the pure muted AI-generated banners directly
    if saveJPEG(cgImage: base.cgImage, to: outPath) {
      generatedCount += 1
    }
    continue
  }

  // Calm, low-saturation matte variations for the remaining covers
  let cycle = i / loadedImages.count
  let hueDegrees = Float((i * 47) % 360)
  let saturation: Float = baseIdx >= 9 ? 0.35 : (0.50 + Float((i * 11) % 30) * 0.01)
  let brightness: Float = baseIdx >= 9 ? -0.18 : (-0.06 + Float((cycle % 5) - 2) * 0.03)

  if transformAndSave(base: base, hueDegrees: hueDegrees, saturation: saturation, brightness: brightness, to: outPath) {
    generatedCount += 1
  }
}

let categoryMapping: [(String, Int)] = [
  ("arithmetic-reasoning.jpg", 5),
  ("data-structures.jpg", 6),
  ("core-algorithms.jpg", 7),
  ("dynamic-programming.jpg", 8),
  ("marathon-mode.jpg", 0),
]

var catCount = 0
for (filename, idx) in categoryMapping {
  let safeIdx = idx % loadedImages.count
  if saveJPEG(cgImage: loadedImages[safeIdx].cgImage, to: "\(categoryOutDir)/\(filename)") {
    catCount += 1
  }
}

print("Generated \(generatedCount) muted AI marathon covers and \(catCount) category covers.")
