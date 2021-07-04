package com.microsoft.research.karya.ui.scenarios.transliteration.validator;

import android.os.Build;

import androidx.annotation.RequiresApi;

import com.microsoft.research.karya.data.model.karya.ng.LanguageType;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.*;
import java.util.HashMap;
import java.util.Map;

public class Validator {

    static List<String> eng_vowels = new ArrayList<String>();
    static List<String> dev_vowels = new ArrayList<String>();
    static Map<LanguageType, Integer> lang_code = new HashMap<LanguageType, Integer>();
    static Map<String, List<String>> eng_dev_map = new HashMap<String, List<String>>();

    public static void init() {
        // Initialize eng vowels
        eng_vowels.add("a");
        eng_vowels.add("e");
        eng_vowels.add("i");
        eng_vowels.add("o");
        eng_vowels.add("u");

        // Initialize dev vowels
        dev_vowels.add("ा");
        dev_vowels.add("ॅ");
        dev_vowels.add("ॉ");
        dev_vowels.add("ि");
        dev_vowels.add("ी");
        dev_vowels.add("ु");
        dev_vowels.add("ू");
        dev_vowels.add("ृ");
        dev_vowels.add("े");
        dev_vowels.add("ै");
        dev_vowels.add("ो");
        dev_vowels.add("ौ");
        dev_vowels.add("ः");
        dev_vowels.add("अ");
        dev_vowels.add("आ");
        dev_vowels.add("ऑ");
        dev_vowels.add("इ");
        dev_vowels.add("ई");
        dev_vowels.add("उ");
        dev_vowels.add("ऊ");
        dev_vowels.add("ए");
        dev_vowels.add("ऐ");
        dev_vowels.add("ओ");
        dev_vowels.add("औ");
        dev_vowels.add("अः");
        dev_vowels.add("ऎ");
        dev_vowels.add("ॆ");
        dev_vowels.add("ॊ");
        dev_vowels.add("ऒ");
        dev_vowels.add("ऽ");
        dev_vowels.add("ॷ");
        dev_vowels.add("ॶ");

        // Initialize language offsets
        lang_code.put(LanguageType.AS, 128);
        lang_code.put(LanguageType.BN, 128);
        lang_code.put(LanguageType.BRX, 0);
        lang_code.put(LanguageType.DOI, 0);
        lang_code.put(LanguageType.GU, 384);
        lang_code.put(LanguageType.HI, 0);
        lang_code.put(LanguageType.KOK, 0);
        lang_code.put(LanguageType.KN, 896);
        lang_code.put(LanguageType.KS, 0);
        lang_code.put(LanguageType.MAI, 0);
        lang_code.put(LanguageType.ML, 1024);
        lang_code.put(LanguageType.MNI, 41664);
        lang_code.put(LanguageType.MR, 0);
        lang_code.put(LanguageType.NE, 0);
        lang_code.put(LanguageType.OR, 512);
        lang_code.put(LanguageType.PA, 256);
        lang_code.put(LanguageType.SA, 0);
        lang_code.put(LanguageType.SD, -768);
        lang_code.put(LanguageType.SAT, 4344);
        lang_code.put(LanguageType.TA, 640);
        lang_code.put(LanguageType.TE, 768);
        lang_code.put(LanguageType.UR, -768);

        eng_dev_map.put("b", Arrays.asList("बभ".split("")));
        eng_dev_map.put("c", Arrays.asList("कचछसशषक़".split("")));
        eng_dev_map.put("d", Arrays.asList("डड़ढढ़दध".split("")));
        eng_dev_map.put("f", Arrays.asList("फफ़".split("")));
        eng_dev_map.put("g", Arrays.asList("गघङजज्ञग़".split("")));
        eng_dev_map.put("j", Arrays.asList("जझञज्ञ".split("")));
        eng_dev_map.put("k", Arrays.asList("कखक़ख़".split("")));
        eng_dev_map.put("l", Arrays.asList("लळऌ".split("")));
        eng_dev_map.put("m", Arrays.asList("म".split("")));
        eng_dev_map.put("n", Arrays.asList("णन".split("")));
        eng_dev_map.put("p", Arrays.asList("पफफ़".split("")));
        eng_dev_map.put("q", Arrays.asList("क".split("")));
        eng_dev_map.put("r", Arrays.asList("र".split("")));
        eng_dev_map.put("s", Arrays.asList("सजझज़शषश्रक्ष".split("")));
        eng_dev_map.put("t", Arrays.asList("त्रटठतथ".split("")));
        eng_dev_map.put("v", Arrays.asList("व".split("")));
        eng_dev_map.put("w", Arrays.asList("व".split("")));
        eng_dev_map.put("x", Arrays.asList("ज़".split("")));
        eng_dev_map.put("y", Arrays.asList("यञ".split("")));
        eng_dev_map.put("z", Arrays.asList("ज़जझ".split("")));
    }

    public static boolean isValid(LanguageType lang, String indicWord, String engWord) throws IOException {
        int offset = lang_code.get(lang);
        String temp_indic = "";
        for (int i = 0; i < indicWord.length(); i++) {
            temp_indic += (char) ((int) (indicWord.charAt(i)) - offset);
        }
        indicWord = temp_indic;

        if (eng_vowels.contains(Character.toString(engWord.charAt(engWord.length() - 1))) && engWord.charAt(engWord.length() - 1) != 'a' && engWord.charAt(engWord.length() - 1) != 'e' && !(dev_vowels.contains(Character.toString(indicWord.charAt(indicWord.length() - 1))))) {
            return false;
        }
        if (!(eng_vowels.contains(Character.toString(engWord.charAt(engWord.length() - 1)))) && dev_vowels.contains(Character.toString(indicWord.charAt(indicWord.length() - 1)))) {
            return false;
        }
        if (eng_vowels.contains(Character.toString(engWord.charAt(0))) && !(dev_vowels.contains(Character.toString(indicWord.charAt(0))))) {
            return false;
        }
        if (!(eng_vowels.contains(Character.toString(engWord.charAt(0)))) && dev_vowels.contains(Character.toString(indicWord.charAt(0)))) {
            return false;
        }

        engWord = engWord.replaceAll("[aeiouhy\'’]", "");
        // eng_word = eng_word.replaceAll("(?i)(.)\\1+", "$1");

        ArrayList<String> indic_word_new = new ArrayList<String>();
        indic_word_new.add(0, "");

        for (int i = 0; i < indicWord.length(); i++) {
            char spelling = indicWord.charAt(i);
            if (spelling == 'ं' || spelling == '॰' || spelling == 'ँ') {
                int temp = indic_word_new.size();
                int temp2 = indic_word_new.size();
                for (int j = 0; j < temp2; j++) {
                    indic_word_new.add(temp, indic_word_new.get(j) + "न");
                    indic_word_new.add(temp + 1, indic_word_new.get(j) + "म");
                    temp += 2;
                }
            } else if (spelling == 'ृ') {
                for (int j = 0; j < indic_word_new.size(); j++) {
                    indic_word_new.set(j, indic_word_new.get(j) + "र");
                }
            } else if (spelling == 'य' || spelling == 'य़' || spelling == 'ञ' || spelling == '्' || spelling == 'ह' || spelling == '़' || dev_vowels.contains(Character.toString(spelling))) {
                continue;
            } else {
                for (int j = 0; j < indic_word_new.size(); j++) {
                    indic_word_new.set(j, indic_word_new.get(j) + spelling);
                }
            }
        }
        for (int i = 0; i < indic_word_new.size(); i++) {
            indic_word_new.set(i, indic_word_new.get(i).replaceAll("(?i)(.)\\1+", "$1"));
        }

        Map<Integer, List<String>> word_variant = new HashMap<Integer, List<String>>();
        List<String> prev = new ArrayList<String>();
        // prev.add("");
        String[] arr = engWord.split("");
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == " ") {
                continue;
            } else if (i == 0) {
                List<String> temp_list = eng_dev_map.get(arr[0]);
                word_variant.put(i, temp_list);
            } else {
                List<String> temp_list = new ArrayList<String>();
                for (String str : prev) {
                    for (String mapping : eng_dev_map.get(arr[i])) {
                        temp_list.add(str + mapping);
                    }
                }
                word_variant.put(i, temp_list);
            }
            prev = word_variant.get(i);
        }

        if (indic_word_new.get(0) == "" && prev == null) {
            return true;
        } else if ((indic_word_new.get(0) == "" && prev != null) || (indic_word_new.get(0) != "" && prev == null)) {
            return false;
        } else {
            for (int i = 0; i < prev.size(); i++) {
                prev.set(i, prev.get(i).replaceAll("(?i)(.)\\1+", "$1"));
            }
        }

        for (int i = 0; i < indic_word_new.size(); i++) {
            if (prev.contains(indic_word_new.get(i))) {
                return true;
            }
        }
        return false;
    }
}