<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Unit tests for the mod_quiz_display_options class.
 *
 * @package    mod_scorm
 * @category   phpunit
 * @copyright  2013 Dan Marsden
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */


defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/mod/scorm/locallib.php');


/**
 * Unit tests for {@link mod_scorm}.
 *
 * @copyright  2013 Dan Marsden
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_scorm_validatepackage_testcase extends basic_testcase {
    public function test_validate_package() {
        global $CFG;
        $filename = "validscorm.zip";
        $file = new zip_archive();
        $file->open($CFG->dirroot.'/mod/scorm/tests/packages/'.$filename, file_archive::OPEN);
        $errors = scorm_validate_package($file);
        $this->assertEmpty($errors);
        $file->close();

        $filename = "validaicc.zip";
        $file = new zip_archive();
        $file->open($CFG->dirroot.'/mod/scorm/tests/packages/'.$filename, file_archive::OPEN);
        $errors = scorm_validate_package($file);
        $this->assertEmpty($errors);
        $file->close();

        $filename = "invalid.zip";
        $file = new zip_archive();
        $file->open($CFG->dirroot.'/mod/scorm/tests/packages/'.$filename, file_archive::OPEN);
        $errors = scorm_validate_package($file);
        $this->assertArrayHasKey('packagefile', $errors);
        if (isset($errors['packagefile'])) {
            $this->assertEquals(get_string('nomanifest', 'scorm'), $errors['packagefile']);
        }
        $file->close();

        $filename = "badscorm.zip";
        $file = new zip_archive();
        $file->open($CFG->dirroot.'/mod/scorm/tests/packages/'.$filename, file_archive::OPEN);
        $errors = scorm_validate_package($file);
        $this->assertArrayHasKey('packagefile', $errors);
        if (isset($errors['packagefile'])) {
            $this->assertEquals(get_string('badimsmanifestlocation', 'scorm'), $errors['packagefile']);
        }
        $file->close();
    }
}
