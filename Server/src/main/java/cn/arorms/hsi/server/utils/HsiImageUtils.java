package cn.arorms.hsi.server.utils;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * Utility class for hyperspectral image processing.
 * Provides methods for reading binary data and generating RGB images.
 *
 * @author Cacciatore
 * @version 1.0 2026-03-05
 */
public final class HsiImageUtils {

    private HsiImageUtils() {
        // Utility class, prevent instantiation
    }

    /**
     * Read band data from binary input stream and generate RGB image.
     * Binary format: [height, width, bands] - Little Endian float32.
     *
     * @param inputStream  Input stream of the binary file
     * @param height       Image height
     * @param width        Image width
     * @param totalBands   Total number of bands
     * @param redBand      Red band index
     * @param greenBand    Green band index
     * @param blueBand     Blue band index
     * @return BufferedImage RGB image
     * @throws IOException If reading fails
     */
    public static BufferedImage readBandsAndCreateRgbImage(
            InputStream inputStream,
            int height,
            int width,
            int totalBands,
            int redBand,
            int greenBand,
            int blueBand) throws IOException {

        float[][] bandR = new float[height][width];
        float[][] bandG = new float[height][width];
        float[][] bandB = new float[height][width];

        byte[] buffer = new byte[4];

        // Read pixel by pixel (each pixel has bands values)
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                for (int b = 0; b < totalBands; b++) {
                    int bytesRead = inputStream.read(buffer, 0, 4);
                    if (bytesRead != 4) {
                        throw new IOException("Unexpected end of file");
                    }
                    // Little Endian float32
                    float value = ByteBuffer.wrap(buffer)
                            .order(ByteOrder.LITTLE_ENDIAN)
                            .getFloat();

                    if (b == redBand) {
                        bandR[y][x] = value;
                    } else if (b == greenBand) {
                        bandG[y][x] = value;
                    } else if (b == blueBand) {
                        bandB[y][x] = value;
                    }
                }
            }
        }

        // Normalize and create RGB image
        return createRgbImage(bandR, bandG, bandB, height, width);
    }

    /**
     * Create RGB BufferedImage from three band matrices with normalization.
     *
     * @param bandR  Red band data matrix
     * @param bandG  Green band data matrix
     * @param bandB  Blue band data matrix
     * @param height Image height
     * @param width  Image width
     * @return BufferedImage RGB image
     */
    public static BufferedImage createRgbImage(
            float[][] bandR,
            float[][] bandG,
            float[][] bandB,
            int height,
            int width) {

        // Find min/max for each band for normalization
        float minR = Float.MAX_VALUE, maxR = Float.MIN_VALUE;
        float minG = Float.MAX_VALUE, maxG = Float.MIN_VALUE;
        float minB = Float.MAX_VALUE, maxB = Float.MIN_VALUE;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                float r = bandR[y][x];
                float g = bandG[y][x];
                float b = bandB[y][x];

                if (!Float.isNaN(r) && !Float.isInfinite(r)) {
                    minR = Math.min(minR, r);
                    maxR = Math.max(maxR, r);
                }
                if (!Float.isNaN(g) && !Float.isInfinite(g)) {
                    minG = Math.min(minG, g);
                    maxG = Math.max(maxG, g);
                }
                if (!Float.isNaN(b) && !Float.isInfinite(b)) {
                    minB = Math.min(minB, b);
                    maxB = Math.max(maxB, b);
                }
            }
        }

        // Create RGB image
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int r = normalizeToByte(bandR[y][x], minR, maxR);
                int g = normalizeToByte(bandG[y][x], minG, maxG);
                int b = normalizeToByte(bandB[y][x], minB, maxB);

                int rgb = (r << 16) | (g << 8) | b;
                image.setRGB(x, y, rgb);
            }
        }

        return image;
    }

    /**
     * Normalize float value to 0-255 byte range.
     *
     * @param value The float value to normalize
     * @param min   Minimum value in the band
     * @param max   Maximum value in the band
     * @return Normalized byte value (0-255)
     */
    public static int normalizeToByte(float value, float min, float max) {
        if (Float.isNaN(value) || Float.isInfinite(value)) {
            return 0;
        }
        if (max == min) {
            return 128;
        }
        float normalized = (value - min) / (max - min);
        return Math.max(0, Math.min(255, (int) (normalized * 255)));
    }
}